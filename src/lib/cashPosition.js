// Cash Position — the pure calculation "brain".
//
// This mirrors, 1:1, the SQL in docs/supabase-cash-position.sql
// (get_cash_position_summary / get_early_pay_preview). It runs client-side so
// the dashboard shows correct totals, aging buckets, and the early-pay PREVIEW
// even when Supabase is not configured (offline demo). Keep the two in sync:
// if you change a bucket boundary or the eligible-status set here, change it in
// the SQL too.
//
// MONEY RULE: everything is integer cents (bigint in the DB). We never do float
// dollar math; we only divide by 100 at the formatting boundary in the view.
// NO money moves anywhere in this module — early pay is preview-only.

// Status groups (must match the CHECK constraints + RPC filters in SQL).
export const OWED_STATUSES = ["pending", "completed", "verified", "invoiced"];
export const VERIFIED_STATUSES = ["verified", "invoiced"]; // confirmed / billed
export const PENDING_STATUSES = ["pending", "completed"]; // not yet verified
export const EARLY_PAY_STATUSES = ["completed", "verified", "invoiced"]; // advance-eligible
export const DRIVER_OWED_STATUSES = ["draft", "finalized"]; // not yet paid out

// advance_rate / fee_rate default (the global financing_config row). Overridable
// per-carrier via the financing_config table; the repository passes through
// whatever the DB returns.
export const FINANCING_DEFAULTS = { advanceRate: 0.85, feeRate: 0.02 };

const toInt = (v) => {
  const n = Math.trunc(Number(v));
  return Number.isFinite(n) ? n : 0;
};

// Whole-day difference from today (local midnight) to a YYYY-MM-DD date.
// Mirrors Postgres `expected_pay_date - current_date`. null => null.
export function daysUntil(dateStr) {
  if (!dateStr) return null;
  const due = new Date(`${dateStr}T00:00:00`);
  if (Number.isNaN(due.getTime())) return null;
  const now = new Date();
  const today0 = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  return Math.round((due.getTime() - today0.getTime()) / 86400000);
}

// Aging bucket key for a days-to-due value. Overdue (<=15, incl. negative) and
// undated (null) fold into the soonest bucket; >45 into 45_plus. Matches SQL.
export function agingBucketKey(daysToDue) {
  if (daysToDue === null || daysToDue <= 15) return "b0_15";
  if (daysToDue <= 30) return "b16_30";
  if (daysToDue <= 45) return "b31_45";
  return "b45_plus";
}

const isPaid = (r) => Boolean(r.paidAt) || r.status === "paid";

// Aggregate cash-position summary over a list of receivables (camelCase rows:
// { amountCents, status, expectedPayDate, paidAt, ... }).
export function computeCashPositionSummary(receivables = [], driverSettlements = []) {
  const owed = receivables.filter((r) => !isPaid(r) && OWED_STATUSES.includes(r.status));

  const sum = (rows) => rows.reduce((s, r) => s + toInt(r.amountCents), 0);

  const buckets = { b0_15: 0, b16_30: 0, b31_45: 0, b45_plus: 0 };
  for (const r of owed) {
    buckets[agingBucketKey(daysUntil(r.expectedPayDate))] += toInt(r.amountCents);
  }

  const verifiedCents = sum(owed.filter((r) => VERIFIED_STATUSES.includes(r.status)));
  const pendingCents = sum(owed.filter((r) => PENDING_STATUSES.includes(r.status)));
  const disputedCents = sum(receivables.filter((r) => r.status === "disputed" && !isPaid(r)));
  const paidCents = sum(receivables.filter(isPaid));

  const owedSettlements = driverSettlements.filter((s) => DRIVER_OWED_STATUSES.includes(s.status));
  const driverNetOwedCents = owedSettlements.reduce((s, d) => s + settlementNetCents(d), 0);

  return {
    totalOwedCents: verifiedCents + pendingCents,
    verifiedCents,
    pendingCents,
    disputedCents,
    paidCents,
    buckets,
    receivableCount: owed.length,
    driverNetOwedCents,
    driverSettlementCount: owedSettlements.length,
  };
}

// Net the carrier owes a driver = gross + accessorials - deductions.
// Mirrors the generated column driver_settlements.net_owed_cents. Prefers a
// precomputed netOwedCents if present (e.g. straight from the DB column).
export function settlementNetCents(s) {
  // Use a precomputed net only when it is genuinely present and numeric; null /
  // "" / undefined fall through to computing from components (a coerced null
  // would otherwise read as a valid 0).
  if (s && s.netOwedCents != null && s.netOwedCents !== "" && Number.isFinite(Number(s.netOwedCents))) {
    return toInt(s.netOwedCents);
  }
  return toInt(s?.grossCents) + toInt(s?.accessorialsCents) - toInt(s?.deductionsCents);
}

// Early-pay eligibility — PREVIEW ONLY. Creates nothing. Mirrors
// get_early_pay_preview(): eligible = unpaid receivables in EARLY_PAY_STATUSES;
// advanceable = round(advanceRate * eligible); fee = round(feeRate * advanceable).
export function computeEarlyPayPreview(receivables = [], rates = FINANCING_DEFAULTS) {
  const advanceRate = Number.isFinite(Number(rates?.advanceRate)) ? Number(rates.advanceRate) : FINANCING_DEFAULTS.advanceRate;
  const feeRate = Number.isFinite(Number(rates?.feeRate)) ? Number(rates.feeRate) : FINANCING_DEFAULTS.feeRate;

  const eligible = receivables.filter((r) => !isPaid(r) && EARLY_PAY_STATUSES.includes(r.status));
  const eligibleAmountCents = eligible.reduce((s, r) => s + toInt(r.amountCents), 0);

  const advanceableCents = Math.round(advanceRate * eligibleAmountCents);
  const previewFeeCents = Math.round(feeRate * advanceableCents);

  return {
    eligibleAmountCents,
    eligibleCount: eligible.length,
    advanceRate,
    feeRate,
    advanceableCents,
    previewFeeCents,
    netFundingCents: advanceableCents - previewFeeCents,
  };
}

// Cents -> dollars, for the formatting boundary only (currency.format expects
// a dollar number). Never feed dollars back into the calc functions.
export const centsToDollars = (cents) => toInt(cents) / 100;
