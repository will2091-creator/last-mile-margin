import { isSupabaseConfigured, supabase } from "./supabaseClient";
import { FINANCING_DEFAULTS } from "./cashPosition";

// Repository for the Cash Position system-of-record. Follows the same contract
// as claimsRepository / documentRepository: every function short-circuits when
// Supabase is unconfigured and returns a discriminated { ok, ..., error } object
// (never throws). The consuming view seeds from local mock data, then merges
// remote rows on result.ok — so the demo always renders. Money stays as integer
// cents end-to-end (DB bigint -> Number here -> divide by 100 only at display).

const toCents = (v) => {
  const n = Math.trunc(Number(v));
  return Number.isFinite(n) ? n : 0;
};

const fromReceivable = (row) => ({
  id: row.id,
  payerName: row.payer_name || "",
  sourceContractRef: row.source_contract_ref || null,
  sourceManifestRef: row.source_manifest_ref || null,
  sourceRoute: row.source_route || null,
  amountCents: toCents(row.amount_cents),
  status: row.status || "pending",
  expectedPayDate: row.expected_pay_date || null,
  paidAt: row.paid_at || null,
  advanceId: row.advance_id || null,
});

const fromSettlement = (row) => ({
  id: row.id,
  driverMemberId: row.driver_member_id || null,
  driverName: row.driver_name || "",
  periodStart: row.period_start || null,
  periodEnd: row.period_end || null,
  grossCents: toCents(row.gross_cents),
  deductionsCents: toCents(row.deductions_cents),
  accessorialsCents: toCents(row.accessorials_cents),
  netOwedCents: toCents(row.net_owed_cents),
  status: row.status || "draft",
  expectedPayDate: row.expected_pay_date || null,
  advanceId: row.advance_id || null,
});

const fromLine = (row) => ({
  id: row.id,
  settlementId: row.settlement_id,
  stopRef: row.stop_ref || null,
  deliveryRef: row.delivery_ref || null,
  lineType: row.line_type,
  amountCents: toCents(row.amount_cents),
  note: row.note || "",
});

const empty = (error) => ({
  ok: false,
  receivables: [],
  driverSettlements: [],
  settlementLines: [],
  financingRates: { ...FINANCING_DEFAULTS },
  error,
});

// Scope a select to the signed-in owner (tolerating legacy/demo null-owner rows),
// matching the claimsRepository pattern. When signed out (anon demo), the dev
// RLS policy returns the null-owner seed.
const scopeToOwner = (query, ownerId) =>
  ownerId ? query.or(`owner_id.eq.${ownerId},owner_id.is.null`) : query;

// Pick the carrier's financing rates: their own financing_config row if present,
// else the global default row, else the hardcoded default.
const pickRates = (rows, ownerId) => {
  if (!rows || !rows.length) return { ...FINANCING_DEFAULTS };
  const ownRow = ownerId ? rows.find((r) => r.owner_id === ownerId) : null;
  const globalRow = rows.find((r) => r.owner_id === null);
  const row = ownRow || globalRow || rows[0];
  return {
    advanceRate: Number.isFinite(Number(row.advance_rate)) ? Number(row.advance_rate) : FINANCING_DEFAULTS.advanceRate,
    feeRate: Number.isFinite(Number(row.fee_rate)) ? Number(row.fee_rate) : FINANCING_DEFAULTS.feeRate,
  };
};

export const loadCashPositionFromSupabase = async () => {
  if (!isSupabaseConfigured || !supabase) {
    return empty("Supabase is not configured.");
  }

  const { data: userData } = await supabase.auth.getUser();
  const ownerId = userData?.user?.id || null;

  // Receivables are the required dataset; if they fail, fall back entirely.
  const { data: rcvRows, error: rcvError } = await scopeToOwner(
    supabase.from("receivables").select("*").order("expected_pay_date", { ascending: true }),
    ownerId
  );
  if (rcvError) return empty(rcvError.message);

  // Driver settlements + lines + config are best-effort; empty on error.
  const [settlementsRes, linesRes, configRes] = await Promise.all([
    scopeToOwner(supabase.from("driver_settlements").select("*").order("created_at", { ascending: false }), ownerId),
    scopeToOwner(supabase.from("settlement_lines").select("*"), ownerId),
    supabase.from("financing_config").select("owner_id, advance_rate, fee_rate"),
  ]);

  return {
    ok: true,
    receivables: (rcvRows || []).map(fromReceivable),
    driverSettlements: (settlementsRes.data || []).map(fromSettlement),
    settlementLines: (linesRes.data || []).map(fromLine),
    financingRates: pickRates(configRes.data, ownerId),
    error: settlementsRes.error?.message || linesRes.error?.message || configRes.error?.message || null,
  };
};
