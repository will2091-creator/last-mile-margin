// Contract Go/No-Go evaluator — the predictive moat. It predicts a prospective
// contract's profit + margin from the owner's OWN historical cost structure (not a
// generic benchmark) and calls it Go / Caution / No-Go against their targets.
// Pure + dependency-free so it runs identically client-side and as the AI fallback.

const COST_CATS = ["labor", "fuel", "truckInsurance", "maintenance", "claims", "other"];
const DEFAULT_COST_RATIO = 0.78; // industry-ish placeholder when the owner has no contracts yet

// learnCostProfile(contracts) — revenue-weighted cost structure across the owner's routes.
export function learnCostProfile(contracts = []) {
  const rows = (Array.isArray(contracts) ? contracts : [])
    .map((row) => {
      const revenue = Number(row.revenue || 0);
      let cost = 0;
      const cats = {};
      COST_CATS.forEach((c) => {
        const v = Number(row[c] || 0);
        cats[c] = v;
        cost += v;
      });
      return { revenue, cost, cats };
    })
    .filter((row) => row.revenue > 0);

  if (!rows.length) {
    return { sampleSize: 0, avgCost: null, avgCostRatio: DEFAULT_COST_RATIO, avgMargin: Math.round((1 - DEFAULT_COST_RATIO) * 1000) / 10, contractMargins: [] };
  }

  const totRev = rows.reduce((s, r) => s + r.revenue, 0);
  const totCost = rows.reduce((s, r) => s + r.cost, 0);
  const avgCostRatio = totRev > 0 ? totCost / totRev : DEFAULT_COST_RATIO;
  return {
    sampleSize: rows.length,
    // Typical ABSOLUTE cost of one of the owner's routes — the default cost estimate for a
    // new route. Using this (not revenue x ratio) makes the predicted margin vary with the
    // offered pay, which is the whole point of a go/no-go call.
    avgCost: totCost / rows.length,
    avgCostRatio,
    avgMargin: Math.round((1 - avgCostRatio) * 1000) / 10,
    contractMargins: rows.map((r) => Math.round((1 - r.cost / r.revenue) * 1000) / 10),
  };
}

// evaluateContract({ revenue, cost, name }, profile, benchmarks)
// `cost` optional — if omitted, predicted from the owner's avg cost ratio.
export function evaluateContract({ revenue, cost, name } = {}, profile, benchmarks = {}) {
  const rev = Number(revenue || 0);
  const target = Number(benchmarks.targetMargin ?? 0);
  const reviewLine = Number(benchmarks.reviewLineMargin ?? 0);

  const hasOverride = cost != null && cost !== "";
  const usedHistory = !hasOverride && profile.sampleSize > 0;
  // Default: the owner's typical absolute route cost. No override + no history: revenue x ratio.
  const predictedCost = hasOverride
    ? Number(cost || 0)
    : profile.sampleSize > 0
      ? profile.avgCost
      : rev * profile.avgCostRatio;
  const profit = rev - predictedCost;
  const margin = rev > 0 ? (profit / rev) * 100 : 0;

  // Verdict vs the owner's own benchmarks.
  let verdict = "no-go";
  const cautionFloor = reviewLine > 0 ? reviewLine : 15;
  if (target > 0 && margin >= target) verdict = "go";
  else if (margin >= cautionFloor) verdict = "caution";

  const breakEvenForTarget = target > 0 && target < 100 ? Math.round(predictedCost / (1 - target / 100)) : null;
  const margins = profile.contractMargins || [];
  const betterThan = margins.filter((m) => margin > m).length;

  return {
    name: name || "This contract",
    rev: Math.round(rev),
    predictedCost: Math.round(predictedCost),
    profit: Math.round(profit),
    margin: Math.round(margin * 10) / 10,
    verdict,
    target,
    reviewLine,
    avgMargin: profile.avgMargin,
    sampleSize: profile.sampleSize,
    breakEven: Math.round(predictedCost),
    breakEvenForTarget,
    portfolioRank: margins.length ? { betterThan, of: margins.length } : null,
    usedHistory: usedHistory && profile.sampleSize > 0,
    confidence: profile.sampleSize >= 4 ? "High" : profile.sampleSize >= 1 ? "Medium" : "Low",
  };
}

// Deterministic narrative — the offline fallback, same shape the AI returns.
export function buildEvalNarrative(result) {
  const money = (n) => `$${Math.round(Number(n || 0)).toLocaleString()}`;
  const headline =
    result.verdict === "go"
      ? `Looks like a go — ~${result.margin}% margin`
      : result.verdict === "caution"
        ? `Proceed with caution — ~${result.margin}% margin`
        : `Hard to justify — ~${result.margin}% margin`;

  const parts = [
    `At ${money(result.rev)} revenue with ${result.usedHistory ? `your typical cost structure (~${money(result.predictedCost)} costs)` : `${money(result.predictedCost)} in costs`}, this nets ${money(result.profit)} — about ${result.margin}% margin.`,
  ];
  if (result.target > 0) {
    parts.push(
      result.margin >= result.target
        ? `That clears your ${result.target}% target.`
        : `That's ${Math.max(0, Math.round(result.target - result.margin))} pts under your ${result.target}% target${result.breakEvenForTarget ? ` — you'd need at least ${money(result.breakEvenForTarget)} in pay to hit it` : ""}.`
    );
  }
  if (result.portfolioRank) {
    parts.push(`It would beat ${result.portfolioRank.betterThan} of your ${result.portfolioRank.of} current route${result.portfolioRank.of === 1 ? "" : "s"} (avg ${result.avgMargin}% margin).`);
  } else {
    parts.push(`Add a couple of your current contracts so I can ground this in your real cost structure.`);
  }

  let topMove;
  if (result.verdict === "go") topMove = "Take it — lock the rate in writing; even if costs run a little high it holds above your review line.";
  else if (result.verdict === "caution") topMove = `Negotiate the pay up${result.breakEvenForTarget ? ` toward ${money(result.breakEvenForTarget)}` : ""}, or trim a cost driver, before you commit.`;
  else topMove = `Pass or renegotiate — at ${money(result.rev)} it can't clear your review line${result.breakEvenForTarget ? `; you'd need closer to ${money(result.breakEvenForTarget)}` : ""}.`;

  return { headline, rationale: parts.join(" "), topMove, verdict: result.verdict, confidence: result.confidence, source: "Computed (offline)" };
}
