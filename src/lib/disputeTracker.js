// Dispute tracking: where each claim's dispute stands, when it's due, when to
// follow up, and how disputes are going overall (by retailer and by category).
// Pure and dependency-free so the Claims page, the dashboard action feed, and
// tests all judge it the same way.

const DAY_MS = 86400000;
export const FOLLOW_UP_DAYS = 14; // no reply this long after sending → follow up
export const DEADLINE_WARN_DAYS = 7; // deadlines this close get surfaced

const pad = (n) => String(n).padStart(2, "0");
export const toDateKey = (date) => `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`;
const startOfDay = (date) => new Date(date.getFullYear(), date.getMonth(), date.getDate());

const MONTHS = ["jan", "feb", "mar", "apr", "may", "jun", "jul", "aug", "sep", "oct", "nov", "dec"];

const buildDate = (year, month, day) => {
  const fullYear = year < 100 ? 2000 + year : year;
  const date = new Date(fullYear, month - 1, day);
  // Reject roll-overs like 2/31 → 3/3.
  if (date.getFullYear() !== fullYear || date.getMonth() !== month - 1 || date.getDate() !== day) return null;
  return date;
};

// Claim dates are free text ("Today", "11/20/2026", "2026-11-20", "Nov 20, 2026").
// Returns a local Date at midnight, or null if it can't be read.
export function parseClaimDate(value, now = new Date()) {
  if (value instanceof Date) return Number.isNaN(value.getTime()) ? null : startOfDay(value);
  const text = String(value || "").trim();
  if (!text) return null;
  const lower = text.toLowerCase();
  if (lower === "today") return startOfDay(now);
  if (lower === "yesterday") return startOfDay(new Date(now.getTime() - DAY_MS));

  let match = text.match(/^(\d{4})-(\d{1,2})-(\d{1,2})/);
  if (match) return buildDate(Number(match[1]), Number(match[2]), Number(match[3]));

  match = text.match(/^(\d{1,2})\/(\d{1,2})\/(\d{2,4})$/);
  if (match) return buildDate(Number(match[3]), Number(match[1]), Number(match[2]));

  match = lower.match(/^([a-z]{3})[a-z]*\.?\s+(\d{1,2})(?:st|nd|rd|th)?,?\s+(\d{4})$/);
  if (match && MONTHS.includes(match[1])) return buildDate(Number(match[3]), MONTHS.indexOf(match[1]) + 1, Number(match[2]));

  return null;
}

// Whole days from today until `date` (negative = in the past).
export function daysUntil(value, now = new Date()) {
  const date = parseClaimDate(value, now);
  if (!date) return null;
  return Math.round((date.getTime() - startOfDay(now).getTime()) / DAY_MS);
}

const addBusinessDays = (date, count) => {
  const next = new Date(date);
  let added = 0;
  while (added < count) {
    next.setDate(next.getDate() + 1);
    const day = next.getDay();
    if (day !== 0 && day !== 6) added += 1;
  }
  return next;
};

const DATE_PATTERN = String.raw`(\d{4}-\d{1,2}-\d{1,2}|\d{1,2}\/\d{1,2}\/\d{2,4}|[A-Za-z]{3,9}\.?\s+\d{1,2}(?:st|nd|rd|th)?,?\s+\d{4})`;

// Reads a dispute deadline out of a claim notice, e.g. "dispute within 30 days"
// or "must be contested by 12/15/2026". Returns "YYYY-MM-DD" or "".
export function extractDisputeDeadline(text, now = new Date()) {
  const source = String(text || "");
  if (!source.trim()) return "";

  const explicit = source.match(
    new RegExp(String.raw`(?:dispute|contest|appeal|respond|rebut|reply|challenge|submitted|received)[^.\n]{0,60}?(?:by|before|no later than|on or before)\s+` + DATE_PATTERN, "i"),
  );
  if (explicit) {
    const date = parseClaimDate(explicit[1].replace(/(\d)(st|nd|rd|th)/i, "$1"), now);
    if (date) return toDateKey(date);
  }

  const relative = source.match(/within\s+(\d{1,3})\s+(calendar\s+|business\s+|working\s+)?days/i);
  if (relative) {
    const count = Number(relative[1]);
    if (count > 0 && count <= 365) {
      const base = startOfDay(now);
      const isBusiness = /business|working/i.test(relative[2] || "");
      const date = isBusiness ? addBusinessDays(base, count) : new Date(base.getFullYear(), base.getMonth(), base.getDate() + count);
      return toDateKey(date);
    }
  }
  return "";
}

const DECIDED = new Set(["won", "lost", "partial"]);
export const isDecided = (claim) => DECIDED.has(claim?.disputeOutcome);

// "won" | "partial" | "lost" | "sent" | "none"
export function getDisputeStage(claim) {
  if (isDecided(claim)) return claim.disputeOutcome;
  if (claim?.disputeSentAt) return "sent";
  return "none";
}

// Deadline urgency for a claim that hasn't been disputed yet. null when there's
// nothing to track (no deadline, already sent/decided, or the claim is closed).
export function getDeadlineStatus(claim, now = new Date()) {
  if (!claim?.disputeDeadline || claim.status === "Closed" || getDisputeStage(claim) !== "none") return null;
  const days = daysUntil(claim.disputeDeadline, now);
  if (days === null) return null;
  const label =
    days < 0
      ? `Deadline passed ${Math.abs(days)} day${days === -1 ? "" : "s"} ago`
      : days === 0
        ? "Dispute due today"
        : days === 1
          ? "Dispute due tomorrow"
          : `Dispute due in ${days} days`;
  const tone = days < 0 ? "overdue" : days <= 2 ? "urgent" : days <= DEADLINE_WARN_DAYS ? "soon" : "ok";
  return { days, label, tone };
}

// A sent dispute with no logged result for FOLLOW_UP_DAYS+ days.
export function getFollowUpStatus(claim, now = new Date()) {
  if (getDisputeStage(claim) !== "sent") return null;
  const sent = new Date(claim.disputeSentAt);
  if (Number.isNaN(sent.getTime())) return null;
  const daysSinceSent = Math.floor((startOfDay(now).getTime() - startOfDay(sent).getTime()) / DAY_MS);
  return { daysSinceSent, due: daysSinceSent >= FOLLOW_UP_DAYS };
}

export const claimRetailer = (claim) => String(claim?.retailer || "").trim();

const emptyBucket = (name) => ({ name, decided: 0, wins: 0, lost: 0, pending: 0, recovered: 0, disputed: 0, winRate: null });

const addToBucket = (bucket, claim) => {
  const stage = getDisputeStage(claim);
  if (stage === "none") return;
  bucket.disputed += 1;
  if (stage === "sent") {
    bucket.pending += 1;
    return;
  }
  bucket.decided += 1;
  if (stage === "lost") bucket.lost += 1;
  else {
    bucket.wins += 1;
    bucket.recovered += Number(claim.disputeRecovered || 0);
  }
};

const finish = (bucket) => ({ ...bucket, winRate: bucket.decided ? Math.round((bucket.wins / bucket.decided) * 100) : null });

// Overall dispute results plus breakdowns. Partial recoveries count as wins.
export function summarizeDisputes(claims = [], now = new Date()) {
  const overall = emptyBucket("All");
  const retailers = new Map();
  const categories = new Map();
  let dueSoon = 0;
  let overdue = 0;
  let followUps = 0;

  for (const claim of claims || []) {
    addToBucket(overall, claim);
    const retailer = claimRetailer(claim) || "No retailer set";
    if (!retailers.has(retailer)) retailers.set(retailer, emptyBucket(retailer));
    addToBucket(retailers.get(retailer), claim);
    const category = claim.category || "Other";
    if (!categories.has(category)) categories.set(category, emptyBucket(category));
    addToBucket(categories.get(category), claim);

    const deadline = getDeadlineStatus(claim, now);
    if (deadline?.tone === "overdue") overdue += 1;
    else if (deadline && deadline.days <= DEADLINE_WARN_DAYS) dueSoon += 1;
    if (getFollowUpStatus(claim, now)?.due) followUps += 1;
  }

  const rank = (list) =>
    list
      .map(finish)
      .filter((bucket) => bucket.disputed > 0)
      .sort((a, b) => b.decided - a.decided || b.disputed - a.disputed || a.name.localeCompare(b.name));

  return {
    ...finish(overall),
    dueSoon,
    overdue,
    followUps,
    byRetailer: rank([...retailers.values()]),
    byCategory: rank([...categories.values()]),
  };
}
