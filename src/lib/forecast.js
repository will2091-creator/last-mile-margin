// Margin Forecast — deterministic forward projection over the owner's saved snapshots.
// Pure + dependency-free so it runs identically client-side and as the AI fallback.
// Completes the Margin Advisor pillar: the brief reads today, the watchdog flags anomalies,
// the forecast looks AHEAD — where profit/margin are heading and whether you'll hit target.

const normMargin = (m) => (Math.abs(Number(m || 0)) <= 1 ? Number(m || 0) * 100 : Number(m || 0));
const DAY_MS = 24 * 60 * 60 * 1000;
const MIN_HISTORY = 4; // need at least this many snapshots to forecast honestly

const toDate = (value) => {
  if (!value) return null;
  const d = new Date(`${value}`.length <= 10 ? `${value}T00:00:00` : value);
  return Number.isNaN(d.getTime()) ? null : d;
};

const dayKey = (d) => d.toISOString().slice(0, 10);
const shortLabel = (d) => d.toLocaleDateString("en-US", { month: "short", day: "numeric" });

// Least-squares slope/intercept of y over x (x in days). Returns slope=0 if x has no spread.
function linearFit(points) {
  const n = points.length;
  if (n < 2) return { slope: 0, intercept: points[0]?.y ?? 0 };
  const sx = points.reduce((s, p) => s + p.x, 0);
  const sy = points.reduce((s, p) => s + p.y, 0);
  const sxx = points.reduce((s, p) => s + p.x * p.x, 0);
  const sxy = points.reduce((s, p) => s + p.x * p.y, 0);
  const denom = n * sxx - sx * sx;
  if (Math.abs(denom) < 1e-9) return { slope: 0, intercept: sy / n };
  const slope = (n * sxy - sx * sy) / denom;
  const intercept = (sy - slope * sx) / n;
  return { slope, intercept };
}

// computeForecast({ savedDays, appSettings, horizonDays })
// Each savedDay: { savedAt, dateRange:{start,end}, profit, revenue, margin, ... }.
export function computeForecast({ savedDays = [], appSettings = {}, horizonDays = 30 } = {}) {
  const targetMargin = Number(appSettings?.profitabilityBenchmarks?.targetMargin ?? 0);

  // Build chronological, per-day-normalized points (a weekly snapshot counts as 1/7 per day).
  const points = (Array.isArray(savedDays) ? savedDays : [])
    .filter((d) => d && Number.isFinite(Number(d.profit)))
    .map((d) => {
      const start = toDate(d.dateRange?.start) || toDate(d.savedAt);
      const end = toDate(d.dateRange?.end) || start;
      if (!end) return null;
      const span = start && end ? Math.min(Math.max(Math.round((end - start) / DAY_MS) + 1, 1), 31) : 1;
      return {
        anchor: end,
        perDayProfit: Number(d.profit || 0) / span,
        margin: normMargin(d.margin),
        revenue: Number(d.revenue || 0) / span,
        label: d.label || shortLabel(end),
      };
    })
    .filter(Boolean)
    .sort((a, b) => a.anchor - b.anchor);

  const daysOfHistory = points.length;
  if (daysOfHistory < MIN_HISTORY) {
    return {
      ready: false,
      daysOfHistory,
      needed: MIN_HISTORY,
      reason: `Save ${MIN_HISTORY - daysOfHistory} more daily snapshot${MIN_HISTORY - daysOfHistory === 1 ? "" : "s"} to unlock your margin forecast.`,
      targetMargin,
    };
  }

  // Model on the most recent 12 snapshots — recent behavior predicts the near future best.
  const window = points.slice(-12);
  const t0 = window[0].anchor.getTime();
  const xDays = (d) => (d.getTime() - t0) / DAY_MS;
  const profitFit = linearFit(window.map((p) => ({ x: xDays(p.anchor), y: p.perDayProfit })));

  const dailyAvgProfit = window.reduce((s, p) => s + p.perDayProfit, 0) / window.length;
  const dailyAvgRevenue = window.reduce((s, p) => s + p.revenue, 0) / window.length;
  const meanAbs = Math.abs(dailyAvgProfit) || 1;
  const variance = window.reduce((s, p) => s + (p.perDayProfit - dailyAvgProfit) ** 2, 0) / window.length;
  const cv = Math.sqrt(variance) / meanAbs; // coefficient of variation — how noisy the run-rate is

  const lastAnchor = window[window.length - 1].anchor;
  const lastActual = window[window.length - 1].perDayProfit;
  const marginNow = window[window.length - 1].margin;

  // Projection is RUN-RATE based — "at your recent pace" — which the data actually supports.
  // Linearly extrapolating a 6-point trend 30 days out (especially a bounded % like margin)
  // produces absurd numbers, so the *trend* is surfaced as a direction + $/day slope rather
  // than an overconfident 30-day point forecast. Margin is the projected-profit / projected-
  // revenue ratio, which stays bounded by construction.
  const projectedProfit = Math.round(dailyAvgProfit * horizonDays);
  const projectedRevenue = dailyAvgRevenue * horizonDays;
  const slopePerDay = profitFit.slope;
  const marginProjected = projectedRevenue > 0 ? Math.max(-100, Math.min(100, (projectedProfit / projectedRevenue) * 100)) : marginNow;

  // Trend classification — relative to the run-rate so small wiggles read as steady.
  const horizonSwing = slopePerDay * horizonDays;
  const trend = Math.abs(horizonSwing) < 0.08 * meanAbs ? "steady" : slopePerDay > 0 ? "improving" : "declining";

  // Confidence from history depth + run-rate stability.
  const confidence = daysOfHistory >= 7 && cv < 0.4 ? "High" : daysOfHistory >= 5 && cv < 0.8 ? "Medium" : "Low";

  // ---- Chart series: actual (solid), then a dashed projected tail showing the trend DIRECTION.
  // The tail uses a dampened slope clamped to the data's own range, so it reads as a forecast
  // without drawing an implausible cliff or moonshot from a handful of points.
  const perDayVals = window.map((p) => p.perDayProfit);
  const wMin = Math.min(...perDayVals);
  const wMax = Math.max(...perDayVals);
  const pad = 0.25 * (wMax - wMin) + 0.1 * meanAbs;
  const hi = wMax + pad;
  const lo = wMin >= 0 ? Math.max(0, wMin - pad) : wMin - pad;
  const clamp = (v) => Math.max(lo, Math.min(hi, v));
  const series = window.map((p) => ({ label: p.label, actual: Math.round(p.perDayProfit) }));
  // Seed the projected line from the last actual point so solid → dashed connects.
  series[series.length - 1].projected = Math.round(lastActual);
  const PROJ_STEPS = 5;
  for (let j = 1; j <= PROJ_STEPS; j += 1) {
    const aheadDays = (horizonDays / PROJ_STEPS) * j;
    const futureDate = new Date(lastAnchor.getTime() + aheadDays * DAY_MS);
    const value = clamp(lastActual + slopePerDay * 0.4 * aheadDays);
    series.push({ label: shortLabel(futureDate), projected: Math.round(value) });
  }

  const marginGap = targetMargin > 0 ? Math.round(marginProjected - targetMargin) : null;
  const onPace = targetMargin > 0 ? marginProjected >= targetMargin - 1 : null;

  return {
    ready: true,
    daysOfHistory,
    horizonDays,
    series,
    projection: {
      projectedProfit,
      dailyAvgProfit: Math.round(dailyAvgProfit),
      slopePerDay: Math.round(slopePerDay),
      trend,
      marginNow: Math.round(marginNow * 10) / 10,
      marginProjected: Math.round(marginProjected * 10) / 10,
    },
    target: { targetMargin: Math.round(targetMargin * 10) / 10, marginGap, onPace },
    confidence,
  };
}

// Deterministic narrative — the offline fallback, same shape the AI returns.
export function buildForecastNarrative(forecast, { companyName = "your business" } = {}) {
  const money = (n) => `$${Math.round(Number(n || 0)).toLocaleString()}`;
  const pts = (n) => `${Math.abs(n)} pt${Math.abs(n) === 1 ? "" : "s"}`;
  const p = forecast.projection;
  const t = forecast.target;
  const dir = p.trend === "improving" ? "trending up" : p.trend === "declining" ? "trending down" : "holding steady";
  const headline =
    p.trend === "steady"
      ? `On pace for ~${money(p.projectedProfit)} profit over the next ${forecast.horizonDays} days`
      : `Profit is ${dir} — ~${money(p.projectedProfit)} projected over ${forecast.horizonDays} days`;

  const outlookParts = [
    `At your recent run-rate of ${money(p.dailyAvgProfit)}/day you'd clear about ${money(p.projectedProfit)} over the next ${forecast.horizonDays} days.`,
  ];
  if (p.trend !== "steady") outlookParts.push(`The trend is ${dir} ~${money(Math.abs(p.slopePerDay))}/day.`);
  if (t.targetMargin > 0) {
    outlookParts.push(
      t.onPace
        ? `Projected margin of ${p.marginProjected}% is on track against your ${t.targetMargin}% target.`
        : `Projected margin of ${p.marginProjected}% lands ${pts(t.marginGap)} under your ${t.targetMargin}% target.`
    );
  }

  let topMove;
  if (t.targetMargin > 0 && t.marginGap !== null && t.marginGap <= -4) {
    topMove = `You're tracking ${pts(t.marginGap)} under your ${t.targetMargin}% target margin — tighten costs on your thinnest route to close the gap before it compounds.`;
  } else if (p.trend === "declining") {
    topMove = `Profit is sliding ~${money(Math.abs(p.slopePerDay))}/day — review what changed across your last few snapshots before the trend hardens.`;
  } else if (p.trend === "improving" && t.onPace !== false) {
    topMove = `You're trending up and on target — keep running the routes that are working and bank the surplus toward your claims reserve.`;
  } else {
    topMove = `Hold the line and keep logging daily snapshots — more history sharpens this forecast and catches shifts earlier.`;
  }

  const sentiment =
    p.trend === "improving" && t.onPace !== false ? "positive" : p.trend === "declining" || (t.marginGap !== null && t.marginGap <= -4) ? "negative" : "neutral";

  return { headline, outlook: outlookParts.join(" "), topMove, sentiment, confidence: forecast.confidence, source: "Computed (offline)" };
}
