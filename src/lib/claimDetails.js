// The claims table has fixed columns. Everything else on a claim (retailer, dispute
// deadline, sent date, outcome, amount recovered, evidence confirmations, sender email…)
// rides along inside the `notes` column as a tagged JSON envelope, so it survives a
// reload without a schema change. Plain-text notes from before this still read fine.
const DETAILS_MARK = "[[fmm-claim-details]]";
const COLUMN_FIELDS = new Set([
  "id", "category", "type", "amount", "driver", "team", "route", "status",
  "preventable", "risk", "date", "notes", "sourceType", "source_type",
]);

export const encodeClaimNotes = (claim) => {
  const details = {};
  for (const [key, value] of Object.entries(claim || {})) {
    if (COLUMN_FIELDS.has(key) || value === undefined || value === null || value === "") continue;
    details[key] = value;
  }
  const notes = claim?.notes || "";
  if (!Object.keys(details).length) return notes;
  return `${DETAILS_MARK}${JSON.stringify({ notes, details })}`;
};

export const hasClaimDetails = (raw) => String(raw || "").startsWith(DETAILS_MARK);

export const decodeClaimNotes = (raw) => {
  const text = raw || "";
  if (!text.startsWith(DETAILS_MARK)) return { notes: text, details: {} };
  try {
    const parsed = JSON.parse(text.slice(DETAILS_MARK.length));
    const details = parsed?.details && typeof parsed.details === "object" ? parsed.details : {};
    // Never let the envelope override real columns.
    for (const key of COLUMN_FIELDS) delete details[key];
    return { notes: String(parsed?.notes || ""), details };
  } catch {
    return { notes: "", details: {} };
  }
};

// Claims saved before the details envelope existed come back without their extras
// (e.g. dispute outcomes). Recover those from this browser's last synced copy.
// `legacyIds` limits this to rows saved without an envelope, so a field someone
// cleared on another device isn't resurrected from this browser.
export const mergeLocalClaimDetails = (remoteClaims, localClaims, legacyIds = null) => {
  if (!Array.isArray(localClaims) || !localClaims.length) return remoteClaims;
  const localById = new Map(localClaims.filter((claim) => claim?.id).map((claim) => [claim.id, claim]));
  return remoteClaims.map((claim) => {
    if (legacyIds && !legacyIds.has(claim.id)) return claim;
    const local = localById.get(claim.id);
    if (!local) return claim;
    const recovered = {};
    for (const [key, value] of Object.entries(local)) {
      if (COLUMN_FIELDS.has(key) || Object.hasOwn(claim, key)) continue;
      recovered[key] = value;
    }
    return Object.keys(recovered).length ? { ...claim, ...recovered } : claim;
  });
};
