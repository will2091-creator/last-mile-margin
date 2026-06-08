// The unified "Do this now" feed. Merges every existing signal (setup steps, contestable
// claims, watchdog anomalies, due reminders, forecast trend) into ONE ranked list of
// actionable items. Pure + dependency-free (besides the shared claims predicate) so it runs
// identically client-side and in tests. It does NOT recompute signals — callers pass the
// already-computed inputs (getSetupStatus / detectAnomalies / loadReminders / computeForecast).
import { isLikelyWorthDisputing } from "./claims.js";

const SEVERITY_WEIGHT = { high: 300, medium: 150, low: 60 };
const SOURCE_TIE = { claim: 6, anomaly: 4, reminder: 3, setup: 2, forecast: 1 };

const money = (n) => `$${Math.round(Number(n || 0)).toLocaleString()}`;
const todayKey = () => new Date().toISOString().slice(0, 10);

// Log-damped $ impact so a $40k claim doesn't dwarf everything, but bigger always outranks.
function impactScore(amount) {
  const a = Math.abs(Number(amount || 0));
  return a > 0 ? Math.min(Math.log10(1 + a) * 40, 200) : 0;
}

// buildActionFeed({ setupStatus, anomalies, reminders, forecast, claims, teams, appSettings, canAccess })
export function buildActionFeed({
  setupStatus = null,
  anomalies = [],
  reminders = [],
  forecast = null,
  claims = [],
  teams = [],
  appSettings = {},
  canAccess = null,
} = {}) {
  const items = [];
  const today = todayKey();
  const riskThresholds = { high: Number(appSettings?.claimRiskThresholds?.high ?? 500) };
  const resolveTeam = (claim) => teams.find((t) => t.name === claim.team) || null;
  const allow = (tab) => (typeof canAccess === "function" ? canAccess(tab) : true);

  // ---- 1) Setup steps (only while onboarding is incomplete) ----
  if (setupStatus && !setupStatus.isComplete && Array.isArray(setupStatus.items)) {
    setupStatus.items
      .filter((s) => !s.complete && !s.skipped)
      .forEach((step, idx) => {
        if (!allow(step.tab)) return;
        items.push({
          id: `setup:${step.id}`,
          source: "setup",
          severity: idx === 0 ? "high" : "medium",
          title: step.title || step.label,
          detail: step.outcome || "",
          tab: step.tab,
          action: { type: "navigate", label: step.actionLabel || "Set up", tab: step.tab },
          setupStepId: step.id,
          icon: "Sparkles",
          order: idx,
        });
      });
  }

  // ---- 2) Contestable claims (the money-on-the-table items) ----
  const contestable = (claims || [])
    .filter((c) => c.status !== "Closed" && isLikelyWorthDisputing(c, { resolveTeam, riskThresholds }))
    .sort((a, b) => Number(b.amount || 0) - Number(a.amount || 0));
  if (allow("Claims")) {
    contestable.forEach((claim) => {
      items.push({
        id: `claim:${claim.id}`,
        source: "claim",
        severity: "high",
        title: `Dispute ${claim.type || "claim"} — ${money(claim.amount)}`,
        detail: `${claim.route ? `${claim.route} · ` : ""}${claim.preventable ? `${claim.preventable} preventable · ` : ""}${claim.risk || "review"} risk`,
        tab: "Claims",
        impact: Number(claim.amount || 0),
        action: { type: "openClaim", label: "Open claim", claimId: claim.id },
        icon: "FileText",
      });
    });
    if (contestable.length >= 2) {
      const exposure = contestable.reduce((s, c) => s + Number(c.amount || 0), 0);
      items.push({
        id: "claim:draft-all",
        source: "claim",
        severity: "high",
        title: `Draft all ${contestable.length} disputes`,
        detail: `${money(exposure)} in contestable exposure across ${contestable.length} claims.`,
        tab: "Claims",
        impact: exposure,
        action: { type: "draftDisputes", label: `Draft ${contestable.length} disputes` },
        icon: "Sparkles",
      });
    }
  }

  // ---- 3) Watchdog anomalies ----
  (anomalies || []).forEach((a) => {
    // The "high-risk-claims" anomaly is the aggregate of the claim items already surfaced above.
    if (a.id === "high-risk-claims" && contestable.length) return;
    const tab = a.tab || "Dashboard";
    if (!allow(tab)) return;
    const urgency = a.kind === "compliance" ? (String(a.id).startsWith("doc-expired") ? 240 : 140) : 0;
    items.push({
      id: `anomaly:${a.id}`,
      source: "anomaly",
      severity: a.severity || "medium",
      title: a.title,
      detail: a.detail || "",
      tab,
      action: { type: "navigate", label: "Review", tab },
      urgency,
      icon: a.kind === "compliance" ? "ShieldCheck" : a.kind === "teams" ? "Users" : "AlertTriangle",
    });
  });

  // ---- 4) Reminders — only dated ones that are overdue or due today ----
  (reminders || []).forEach((r) => {
    if (!r.due) return;
    const overdue = r.due < today;
    const dueToday = r.due === today;
    if (!overdue && !dueToday) return;
    items.push({
      id: `reminder:${r.id}`,
      source: "reminder",
      severity: overdue ? "high" : "medium",
      title: r.text,
      detail: overdue ? `Overdue · was due ${r.due}` : "Due today",
      tab: "Dashboard",
      reminderId: r.id,
      action: { type: "reminderDone", label: "Mark done" },
      urgency: overdue ? 220 : 120,
      icon: "ClipboardCheck",
    });
  });

  // ---- 5) Forecast nudge (single, low priority) ----
  if (forecast && forecast.ready && allow("Profitability") && (forecast.projection?.trend === "declining" || forecast.target?.onPace === false)) {
    const declining = forecast.projection?.trend === "declining";
    items.push({
      id: "forecast:trajectory",
      source: "forecast",
      severity: "low",
      title: declining ? "Profit is trending down" : "Projected margin is under target",
      detail: declining
        ? `Run-rate ~${money(forecast.projection.dailyAvgProfit)}/day and sliding — review your thinnest route.`
        : `Projected ${forecast.projection.marginProjected}% vs your ${forecast.target.targetMargin}% target.`,
      tab: "Profitability",
      action: { type: "navigate", label: "See forecast", tab: "Profitability" },
      icon: "BarChart3",
    });
  }

  // ---- Score + rank ----
  items.forEach((it) => {
    it.score =
      (SEVERITY_WEIGHT[it.severity] || 0) +
      impactScore(it.impact) +
      (it.urgency || 0) +
      (it.source === "setup" ? Math.max(0, 180 - (it.order || 0) * 30) : 0) +
      (SOURCE_TIE[it.source] || 0);
  });
  items.sort(
    (a, b) =>
      b.score - a.score ||
      Math.abs(Number(b.impact || 0)) - Math.abs(Number(a.impact || 0)) ||
      a.id.localeCompare(b.id)
  );
  return items;
}

export function feedCounts(items = []) {
  return { total: items.length, high: items.filter((i) => i.severity === "high").length };
}
