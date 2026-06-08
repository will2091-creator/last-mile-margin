// Proactive Watchdog — deterministic anomaly detection over the owner's workspace.
// Returns a ranked list of anomalies the AI layer then prioritizes + narrates.
// Pure + dependency-free so it runs identically client-side and as an AI fallback.

const SEV_RANK = { high: 3, medium: 2, low: 1 };
const normMargin = (m) => (Math.abs(Number(m || 0)) <= 1 ? Number(m || 0) * 100 : Number(m || 0));
const DAY_MS = 24 * 60 * 60 * 1000;

function contractRows(contracts = []) {
  return (contracts || [])
    .map((row) => {
      const revenue = Number(row.revenue || 0);
      const cost =
        Number(row.labor || 0) + Number(row.fuel || 0) + Number(row.truckInsurance || 0) +
        Number(row.maintenance || 0) + Number(row.claims || 0) + Number(row.other || 0);
      return { name: row.contract || "Unnamed route", revenue, profit: revenue - cost, margin: revenue ? Math.round(((revenue - cost) / revenue) * 100) : 0 };
    })
    .filter((row) => row.revenue > 0);
}

// detectAnomalies({ savedDays, claims, teams, contracts, docs, appSettings, today })
// `today` = { profit, revenue, margin } for the current period (optional).
export function detectAnomalies({ savedDays = [], claims = [], teams = [], contracts = [], docs = [], appSettings = {}, today = null } = {}) {
  const anomalies = [];
  const money = (n) => `$${Math.round(Number(n || 0)).toLocaleString()}`;

  // ---- Profit / margin trend (needs history) ----
  const history = (Array.isArray(savedDays) ? savedDays : []).slice(0, 8);
  const latest = today && (today.revenue || today.profit) ? today : history[0] || null;
  const prior = history.slice(today ? 0 : 1, today ? 7 : 8);
  if (latest && prior.length >= 2) {
    const avgProfit = prior.reduce((s, d) => s + Number(d.profit || 0), 0) / prior.length;
    const avgMargin = prior.reduce((s, d) => s + normMargin(d.margin), 0) / prior.length;
    const profit = Number(latest.profit || 0);
    const margin = normMargin(latest.margin ?? today?.margin);
    if (avgProfit > 0) {
      const deltaPct = Math.round(((profit - avgProfit) / avgProfit) * 100);
      if (deltaPct <= -25) anomalies.push({ id: "profit-drop", kind: "profit", severity: deltaPct <= -40 ? "high" : "medium", title: `Net profit down ${Math.abs(deltaPct)}% vs your recent average`, detail: `${money(profit)} today vs a ${prior.length}-day average of ${money(avgProfit)}.`, tab: "Profitability" });
    }
    const marginDrop = Math.round(avgMargin - margin);
    if (marginDrop >= 5) anomalies.push({ id: "margin-drop", kind: "margin", severity: marginDrop >= 10 ? "high" : "medium", title: `Margin slipped ${marginDrop} points`, detail: `${Math.round(margin)}% now vs a ${prior.length}-day average of ${Math.round(avgMargin)}%.`, tab: "Profitability" });
  }

  // ---- Contract margin erosion ----
  const rows = contractRows(contracts);
  const thin = rows.filter((r) => r.margin < 20).sort((a, b) => a.margin - b.margin);
  if (thin.length) {
    const w = thin[0];
    anomalies.push({ id: `contract-thin-${w.name}`, kind: "contract", severity: w.margin < 12 ? "high" : "medium", title: `${w.name} margin is thin (${w.margin}%)`, detail: `${money(w.revenue)} revenue at ${w.margin}% margin${thin.length > 1 ? ` — and ${thin.length - 1} other route${thin.length > 2 ? "s" : ""} below 20%.` : "."}`, tab: "Profitability" });
  }

  // ---- Claims: high-risk + exposure vs reserve ----
  const openClaims = (claims || []).filter((c) => c.status !== "Closed");
  const openExposure = openClaims.reduce((s, c) => s + Number(c.amount || 0), 0);
  const highRisk = openClaims.filter((c) => c.risk === "High");
  if (highRisk.length) {
    const top = [...highRisk].sort((a, b) => Number(b.amount || 0) - Number(a.amount || 0))[0];
    anomalies.push({ id: "high-risk-claims", kind: "claims", severity: "high", title: `${highRisk.length} high-risk open claim${highRisk.length > 1 ? "s" : ""}`, detail: `Largest: ${top.type || "claim"} at ${money(top.amount)}${top.preventable ? ` (${top.preventable} preventable)` : ""}. ${money(openExposure)} total open exposure.`, tab: "Claims" });
  }
  const reserve = Number(appSettings?.claimReserveTarget ?? appSettings?.claimReserve ?? 0);
  if (reserve > 0 && openExposure > reserve) {
    anomalies.push({ id: "reserve-under", kind: "claims", severity: "medium", title: "Open exposure exceeds your reserve", detail: `${money(openExposure)} open vs a ${money(reserve)} reserve target.`, tab: "Claims" });
  }

  // ---- Compliance documents ----
  (docs || []).forEach((doc) => {
    if (!doc.expiry) return;
    const exp = new Date(`${doc.expiry}T00:00:00`);
    if (Number.isNaN(exp.getTime())) return;
    const today0 = new Date();
    today0.setHours(0, 0, 0, 0);
    const days = Math.round((exp - today0) / DAY_MS);
    const name = doc.label || doc.type;
    if (days < 0) anomalies.push({ id: `doc-expired-${doc.id || name}`, kind: "compliance", severity: "high", title: `${name} expired`, detail: `Expired ${Math.abs(days)} day${Math.abs(days) === 1 ? "" : "s"} ago — renew before dispatch.`, tab: "Compliance" });
    else if (days <= 30) anomalies.push({ id: `doc-expiring-${doc.id || name}`, kind: "compliance", severity: days <= 7 ? "high" : "medium", title: `${name} expires in ${days} day${days === 1 ? "" : "s"}`, detail: `Renew before it lapses.`, tab: "Compliance" });
  });

  // ---- Team readiness ----
  const atRisk = (teams || []).filter((t) => t.status === "At Risk");
  const missingPhotos = (teams || []).filter((t) => t.photoStatus !== "Uploaded");
  if (atRisk.length) anomalies.push({ id: "teams-at-risk", kind: "teams", severity: "medium", title: `${atRisk.length} team${atRisk.length > 1 ? "s" : ""} flagged at risk`, detail: `${atRisk.map((t) => t.name).slice(0, 3).join(", ")} — review before dispatch.`, tab: "Teams" });
  if (missingPhotos.length) anomalies.push({ id: "missing-photos", kind: "teams", severity: missingPhotos.length > 1 ? "medium" : "low", title: `${missingPhotos.length} team${missingPhotos.length > 1 ? "s" : ""} missing today's route photo`, detail: `Missing proof is how claims become losses.`, tab: "Teams" });

  // ---- Pace to monthly target ----
  const target = Number(appSettings?.monthlyProfitTarget ?? 0);
  if (target > 0 && history.length >= 3) {
    const avg = history.reduce((s, d) => s + Number(d.profit || 0), 0) / history.length;
    const projected = avg * 30;
    if (projected < target * 0.9) anomalies.push({ id: "pace-target", kind: "pace", severity: "medium", title: "Behind pace on the monthly target", detail: `At your recent daily average you'd clear ~${money(projected)} this month vs a ${money(target)} target.`, tab: "Dashboard" });
  }

  return anomalies.sort((a, b) => (SEV_RANK[b.severity] || 0) - (SEV_RANK[a.severity] || 0));
}

export function anomalyCounts(anomalies = []) {
  return {
    total: anomalies.length,
    high: anomalies.filter((a) => a.severity === "high").length,
    medium: anomalies.filter((a) => a.severity === "medium").length,
  };
}
