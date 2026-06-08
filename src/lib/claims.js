// Shared claim-contestability logic. Extracted from ClaimsDashboard so the action feed
// and the Claims page judge "is this worth disputing?" identically (no drift).
// Team resolution is injected (`resolveTeam`) so each caller keeps its own team-lookup
// fidelity without this lib depending on ClaimsDashboard's driver→team helpers.

const HIGH_DEFAULT = 500;

// Grammatical quantity for the "Draft …" dispute CTA:
// 1 → "the dispute", 2 → "both disputes", 3+ → "all N disputes".
export const draftDisputesPhrase = (n) => (Number(n) === 1 ? "the dispute" : Number(n) === 2 ? "both disputes" : `all ${n} disputes`);

export function getEvidenceChecklist(claim, { resolveTeam, riskThresholds } = {}) {
  const high = Number(riskThresholds?.high ?? HIGH_DEFAULT);
  const team = resolveTeam ? resolveTeam(claim) : null;
  const hasRouteDetails = Boolean(claim.route && claim.date);
  const hasDailyPhoto = team?.photoStatus === "Uploaded";
  const isResolved = claim.status === "Closed";
  const isHighRisk = claim.risk === "High" || Number(claim.amount || 0) >= high;

  return [
    { label: "Retailer claim notice", present: true },
    { label: "Route and delivery date matched", present: hasRouteDetails },
    { label: "Driver statement collected", present: isResolved || claim.preventable === "No" },
    { label: "Daily route photo uploaded", present: hasDailyPhoto },
    { label: "Damage photos attached", present: isResolved || !isHighRisk },
    { label: "Proof of delivery / customer sign-off", present: claim.category !== "Penalty" ? isResolved : Boolean(claim.route) },
  ];
}

export function getMissingEvidence(claim, opts) {
  return getEvidenceChecklist(claim, opts).filter((item) => !item.present).map((item) => item.label);
}

export function isLikelyWorthDisputing(claim, opts = {}) {
  const high = Number(opts.riskThresholds?.high ?? HIGH_DEFAULT);
  return (
    claim.status !== "Closed" &&
    Number(claim.amount || 0) >= high &&
    (claim.preventable !== "Yes" || claim.risk === "High" || getMissingEvidence(claim, opts).length > 0)
  );
}
