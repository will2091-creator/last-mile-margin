// Shared claim-contestability logic. Extracted from ClaimsDashboard so the action feed
// and the Claims page judge "is this worth disputing?" identically (no drift).
// Team resolution is injected (`resolveTeam`) so each caller keeps its own team-lookup
// fidelity without this lib depending on ClaimsDashboard's driver→team helpers.

import { getDisputeStage } from "./disputeTracker.js";

const HIGH_DEFAULT = 500;

// Grammatical quantity for the "Draft …" dispute CTA:
// 1 → "the dispute", 2 → "both disputes", 3+ → "all N disputes".
export const draftDisputesPhrase = (n) => (Number(n) === 1 ? "the dispute" : Number(n) === 2 ? "both disputes" : `all ${n} disputes`);

// What proof wins which kind of claim. Labels double as storage keys (attached files and
// "I have this" confirmations are keyed by label), so keep existing labels stable.
const CATEGORY_EVIDENCE = {
  Property: [
    { label: "Damage photos attached", tip: "Photos of the reported damage, plus the delivery area before you started work if you have them." },
    { label: "Proof of delivery / customer sign-off", tip: "Signed delivery receipt showing the customer accepted with no damage noted." },
  ],
  Cargo: [
    { label: "Damage photos attached", tip: "Photos of the item and packaging at pickup and at delivery." },
    { label: "Proof of delivery / customer sign-off", tip: "Signed delivery receipt or POD showing no exceptions noted at drop-off." },
    { label: "Bill of lading / pick ticket", tip: "Shows the condition and contents when you took custody — clean BOL means damage happened before you." },
  ],
  Penalty: [
    { label: "GPS or time-stamped delivery scans", tip: "Arrival and completion times from your routing app or scanner." },
    { label: "Customer contact / call-ahead log", tip: "Call, text, or app records showing you reached out to the customer." },
  ],
};

// Extra prompts for specific claim types (matched by keyword, case-insensitive).
const TYPE_EVIDENCE = [
  { match: /concealed/, label: "Delivery date vs. damage report date", tip: "Concealed damage reported days after a clean delivery is hard for the retailer to pin on you." },
  { match: /window|late|departure/, label: "Dispatch plan showing the assigned window", tip: "The window you were actually given — retailers often penalize against a different one." },
  { match: /photo compliance|failed photo/, label: "The delivery photos that were taken", tip: "Time-stamped photos prove the requirement was met even if the upload failed." },
  { match: /paperwork|status|scan/, label: "Completed paperwork or status history", tip: "Screenshots of the status updates or paperwork as submitted." },
  { match: /install|water|leak|kit/, label: "Install checklist / leak test", tip: "Completed install checklist or a photo of the dry connection after testing." },
  { match: /missing parts|wrong item|lost item|return pickup|haul-away/, label: "Load manifest or pickup receipt", tip: "What was actually loaded or picked up, item by item." },
  { match: /no access|no attempt|not contacted|refused|abandon/, label: "Attempt record (photos at the door, call log)", tip: "Proof you showed up and tried: door photos, call attempts, time on site." },
];

const evidenceKey = (label) => label;

export function getEvidenceChecklist(claim, { resolveTeam } = {}) {
  const team = resolveTeam ? resolveTeam(claim) : null;
  const confirmed = (label) => claim?.evidence?.[evidenceKey(label)] === true;
  const items = [
    { label: "Retailer claim notice", tip: "The claim or chargeback notice itself.", auto: true, present: true },
    {
      label: "Route and delivery date matched",
      tip: "The route and delivery date on this claim.",
      auto: true,
      present: Boolean(claim?.route && claim?.date),
    },
    { label: "Driver statement collected", tip: "A short written account from the driver of what happened at the stop." },
    {
      label: "Daily route photo uploaded",
      tip: "The team's truck/route photo for that day, from the Teams page.",
      present: team?.photoStatus === "Uploaded",
      auto: team?.photoStatus === "Uploaded",
    },
    ...(CATEGORY_EVIDENCE[claim?.category] || CATEGORY_EVIDENCE.Property),
  ];

  const type = String(claim?.type || "").toLowerCase();
  TYPE_EVIDENCE.forEach((entry) => {
    if (entry.match.test(type)) items.push({ label: entry.label, tip: entry.tip });
  });

  const seen = new Set();
  return items
    .filter((item) => (seen.has(item.label) ? false : seen.add(item.label)))
    .map((item) => ({ ...item, auto: Boolean(item.auto), present: Boolean(item.present) || confirmed(item.label) }));
}

export function getMissingEvidence(claim, opts) {
  return getEvidenceChecklist(claim, opts).filter((item) => !item.present).map((item) => item.label);
}

// Open, high-value, not yet disputed, and not a clear crew-caused loss.
export function isLikelyWorthDisputing(claim, opts = {}) {
  const high = Number(opts.riskThresholds?.high ?? HIGH_DEFAULT);
  return (
    claim.status !== "Closed" &&
    getDisputeStage(claim) === "none" &&
    Number(claim.amount || 0) >= high &&
    (claim.preventable !== "Yes" || claim.risk === "High")
  );
}
