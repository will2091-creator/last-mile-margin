import { supabase } from "./supabaseClient";
import { normalizeRole } from "./roles";
import { FINANCING_DEFAULTS } from "./cashPosition";

export async function getCurrentUser() {
  const { data, error } = await supabase.auth.getUser();
  if (error) return { ok: false, user: null, error: error.message };
  return { ok: true, user: data.user };
}

async function getWorkspaceOwnerId(user) {
  const { data } = await supabase
    .from("team_memberships")
    .select("owner_id")
    .or(`user_id.eq.${user.id},email.eq.${user.email}`)
    .limit(1)
    .maybeSingle();

  return data?.owner_id || user.id;
}

async function safeSelect(runQuery, fallback) {
  try {
    const { data, error } = await runQuery();
    if (error) return fallback;
    return data || fallback;
  } catch (_error) {
    return fallback;
  }
}

async function resolveClaimUuid(claimId, ownerId) {
  const trimmed = String(claimId || "").trim();
  const uuidPattern = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
  let query = supabase.from("claims").select("id").limit(1).maybeSingle();

  if (uuidPattern.test(trimmed)) {
    query = query.eq("id", trimmed);
  } else {
    query = query.eq("app_claim_id", trimmed);
  }

  if (ownerId) query = query.eq("owner_id", ownerId);

  const { data, error } = await query;
  if (error) return { ok: false, error: error.message };
  if (!data?.id) return { ok: false, error: "Claim was not found." };
  return { ok: true, id: data.id };
}

export async function loadOpenClaims() {
  const { data: userData } = await supabase.auth.getUser();
  const user = userData?.user;
  const ownerId = user ? await getWorkspaceOwnerId(user) : null;

  let query = supabase
    .from("claims")
    .select("id,app_claim_id,category,type,team,driver,route,amount,status,preventable,claim_date,risk,owner_id")
    .neq("status", "Closed")
    .order("created_at", { ascending: false });

  if (ownerId) query = query.eq("owner_id", ownerId);

  const { data, error } = await query;
  if (error) return { ok: false, claims: [], error: error.message };

  return {
    ok: true,
    claims: (data || []).map((claim) => ({
      ...claim,
      id: claim.app_claim_id || claim.id,
      amount: Number(claim.amount || 0),
      date: claim.claim_date,
    })),
  };
}

export async function loadClaimsCenter() {
  const { data: userData } = await supabase.auth.getUser();
  const user = userData?.user;
  const ownerId = user ? await getWorkspaceOwnerId(user) : null;

  let query = supabase
    .from("claims")
    .select("id,app_claim_id,category,type,team,driver,route,amount,status,preventable,claim_date,risk,owner_id,created_at")
    .order("created_at", { ascending: false })
    .limit(100);

  if (ownerId) query = query.eq("owner_id", ownerId);

  const { data, error } = await query;
  if (error) return { ok: false, claims: [], error: error.message };

  return {
    ok: true,
    claims: (data || []).map((claim) => ({
      ...claim,
      id: claim.app_claim_id || claim.id,
      amount: Number(claim.amount || 0),
      date: claim.claim_date || claim.created_at,
    })),
  };
}

export async function loadDashboardSnapshot() {
  const { data: userData, error: userError } = await supabase.auth.getUser();
  if (userError) return { ok: false, snapshot: null, error: userError.message };

  const user = userData?.user;
  if (!user) return { ok: false, snapshot: null, error: "Sign in first." };

  const ownerId = await getWorkspaceOwnerId(user);
  const { data, error } = await supabase
    .from("app_state")
    .select("state, updated_at")
    .eq("state_key", `user:${ownerId}`)
    .maybeSingle();

  if (error) return { ok: false, snapshot: null, error: error.message };

  const latestDay = Array.isArray(data?.state?.savedDays) ? data.state.savedDays[0] : null;
  return {
    ok: true,
    snapshot: latestDay
      ? {
          profit: Number(latestDay.profit || 0),
          claimsExposure: Number(latestDay.claimsExposure || 0),
          openClaims: Number(latestDay.openClaims || 0),
          revenue: Number(latestDay.revenue || 0),
          costs: Number(latestDay.costs || 0),
          label: latestDay.label || "Latest saved day",
        }
      : null,
  };
}

export async function loadOwnerCommandCenter() {
  const { data: userData, error: userError } = await supabase.auth.getUser();
  if (userError) return { ok: false, summary: null, error: userError.message };

  const user = userData?.user;
  if (!user) return { ok: false, summary: null, error: "Sign in first." };

  const ownerId = await getWorkspaceOwnerId(user);
  const since = new Date();
  since.setHours(0, 0, 0, 0);

  const [memberships, documents, checkIns, appState] = await Promise.all([
    safeSelect(
      () => supabase
        .from("team_memberships")
        .select("id,email,display_name,role,status,user_id,owner_id")
        .eq("owner_id", ownerId)
        .order("created_at", { ascending: false }),
      []
    ),
    safeSelect(
      () => supabase
        .from("documents")
        .select("id,name,category,status,expiration,owner,notes,uploaded_at,created_at")
        .eq("owner_id", ownerId)
        .order("created_at", { ascending: false })
        .limit(30),
      []
    ),
    safeSelect(
      () => supabase
        .from("route_checkins")
        .select("id,user_id,route_name,truck,notes,photo_url,created_at")
        .eq("owner_id", ownerId)
        .gte("created_at", since.toISOString())
        .order("created_at", { ascending: false })
        .limit(30),
      []
    ),
    safeSelect(
      () => supabase
        .from("app_state")
        .select("state, updated_at")
        .eq("state_key", `user:${ownerId}`)
        .maybeSingle(),
      null
    ),
  ]);

  const savedDays = Array.isArray(appState?.state?.savedDays) ? appState.state.savedDays : [];
  const latestDay = savedDays[0] || null;
  const receipts = documents.filter((doc) => doc.category === "Expense Receipts");
  const pendingReceipts = receipts.filter((doc) => !/approved|reviewed/i.test(String(doc.status || "")));
  const missingDocs = documents.filter((doc) => /missing|expired|expiring/i.test(`${doc.status || ""} ${doc.expiration || ""}`));
  const activeMembers = memberships.filter((member) => member.status !== "disabled");
  const checkedInUserIds = new Set(checkIns.map((item) => item.user_id).filter(Boolean));
  const checkedInCount = activeMembers.filter((member) => member.user_id && checkedInUserIds.has(member.user_id)).length;

  return {
    ok: true,
    summary: {
      ownerId,
      savedDays,
      latestDay,
      teamMembers: activeMembers,
      receipts,
      pendingReceipts,
      missingDocs,
      checkIns,
      checkedInCount,
      notCheckedInCount: Math.max(activeMembers.length - checkedInCount, 0),
    },
  };
}

export async function updateClaimStatus(claimId, status) {
  const { data: userData } = await supabase.auth.getUser();
  const user = userData?.user;
  const ownerId = user ? await getWorkspaceOwnerId(user) : null;
  const resolved = await resolveClaimUuid(claimId, ownerId);
  if (!resolved.ok) return resolved;

  const { error } = await supabase
    .from("claims")
    .update({ status })
    .eq("id", resolved.id);

  if (error) return { ok: false, error: error.message };
  return { ok: true };
}

export async function updateReceiptStatus(receiptId, status) {
  const { data: userData, error: userError } = await supabase.auth.getUser();
  if (userError) return { ok: false, error: userError.message };
  const user = userData?.user;
  if (!user) return { ok: false, error: "Sign in first." };
  const ownerId = await getWorkspaceOwnerId(user);

  const { error } = await supabase
    .from("documents")
    .update({ status })
    .eq("id", receiptId)
    .eq("owner_id", ownerId);

  if (error) return { ok: false, error: error.message };
  return { ok: true };
}

export async function loadTeamMembership() {
  const { data: userData, error: userError } = await supabase.auth.getUser();
  if (userError) return { ok: false, membership: null, error: userError.message };
  const user = userData?.user;
  if (!user) return { ok: false, membership: null, error: "Sign in first." };

  const { data, error } = await supabase
    .from("team_memberships")
    .select("id,email,display_name,role,status,owner_id,user_id")
    .or(`user_id.eq.${user.id},email.eq.${user.email}`)
    .limit(1)
    .maybeSingle();

  if (error) return { ok: false, membership: null, error: error.message };
  if (!data) {
    return {
      ok: true,
      membership: {
        email: user.email,
        display_name: user.user_metadata?.display_name || user.email,
        role: "owner",
        status: "active",
        owner_id: user.id,
        user_id: user.id,
        isFallbackOwner: true,
      },
    };
  }

  return {
    ok: true,
    membership: {
      ...data,
      role: normalizeRole(data.role),
      status: data.status || "active",
    },
  };
}

export async function saveRouteCheckIn({ routeName, truck, notes, photoUrl }) {
  const { data: userData, error: userError } = await supabase.auth.getUser();
  if (userError) return { ok: false, error: userError.message };
  const user = userData?.user;
  if (!user) return { ok: false, error: "Sign in first." };
  const ownerId = await getWorkspaceOwnerId(user);

  const { error } = await supabase.from("route_checkins").insert({
    owner_id: ownerId,
    user_id: user.id,
    route_name: routeName,
    truck,
    notes,
    photo_url: photoUrl,
  });

  if (error) return { ok: false, error: error.message };
  return { ok: true };
}

export async function uploadClaimEvidence({ claimId, fileUri, fileName, contentType = "image/jpeg" }) {
  const { data: userData, error: userError } = await supabase.auth.getUser();
  if (userError) return { ok: false, error: userError.message };
  const user = userData?.user;
  if (!user) return { ok: false, error: "Sign in first." };
  const ownerId = await getWorkspaceOwnerId(user);
  const resolved = await resolveClaimUuid(claimId, ownerId);
  if (!resolved.ok) return resolved;

  const response = await fetch(fileUri);
  const blob = await response.blob();
  const storagePath = `${ownerId}/${resolved.id}/${Date.now()}-${fileName}`;

  const { error: uploadError } = await supabase.storage
    .from("claim-evidence")
    .upload(storagePath, blob, { contentType, upsert: false });

  if (uploadError) return { ok: false, error: uploadError.message };

  const { error: recordError } = await supabase.from("claim_evidence").insert({
    owner_id: ownerId,
    claim_id: resolved.id,
    file_name: fileName,
    file_path: storagePath,
    file_type: contentType,
  });

  if (recordError) return { ok: false, error: recordError.message };
  return { ok: true, storagePath };
}

export async function uploadExpenseReceipt({
  fileUri,
  fileName,
  contentType = "image/jpeg",
  expenseType,
  vendor,
  amount,
  notes,
}) {
  const { data: userData, error: userError } = await supabase.auth.getUser();
  if (userError) return { ok: false, error: userError.message };
  const user = userData?.user;
  if (!user) return { ok: false, error: "Sign in first." };

  const ownerId = await getWorkspaceOwnerId(user);
  const response = await fetch(fileUri);
  const blob = await response.blob();
  const safeName = String(fileName || "receipt.jpg").replace(/[^a-zA-Z0-9._-]/g, "-");
  const extension = safeName.includes(".") ? safeName.split(".").pop() : "jpg";
  const uploadedAt = new Date().toISOString();
  const storagePath = `${user.id}/receipts/${Date.now()}-${safeName || `receipt.${extension}`}`;
  const receiptAmount = Number(amount || 0);
  const receiptType = expenseType || "Other";
  const receiptVendor = vendor?.trim() || "Unknown vendor";

  const { error: uploadError } = await supabase.storage
    .from("documents")
    .upload(storagePath, blob, { contentType, upsert: false });

  if (uploadError) return { ok: false, error: uploadError.message };

  const { data, error: recordError } = await supabase
    .from("documents")
    .insert({
      owner_id: ownerId,
      name: `${receiptType} receipt - ${receiptVendor}`,
      category: "Expense Receipts",
      required: false,
      status: "Uploaded",
      expiration: "N/A",
      owner: user.email,
      notes: [
        `${receiptType} expense`,
        receiptAmount ? `Amount: ${receiptAmount.toFixed(2)}` : "Amount not entered",
        `Vendor: ${receiptVendor}`,
        notes?.trim() ? `Notes: ${notes.trim()}` : "",
      ].filter(Boolean).join(" | "),
      file_path: storagePath,
      file_name: safeName,
      file_type: contentType,
      file_size: blob.size || 0,
      uploaded_at: uploadedAt,
    })
    .select("*")
    .single();

  if (recordError) return { ok: false, error: recordError.message };
  return { ok: true, receipt: data };
}

// --- Cash Position (financial system-of-record) -----------------------------
// Mirrors the web app's src/lib/cashPositionRepository.js. Every read is
// best-effort: the cash-position tables may not be deployed to the live DB yet
// (the schema in docs/supabase-cash-position.sql is run manually), so a missing
// table / RLS denial / empty set returns { ok: false } and the screen keeps its
// offline demo seed. Money stays integer cents end-to-end (DB bigint -> Number
// here -> divide by 100 only at display).

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

export async function loadCashPosition() {
  const { data: userData, error: userError } = await supabase.auth.getUser();
  if (userError) return { ok: false, error: userError.message };
  const user = userData?.user;
  if (!user) return { ok: false, error: "Sign in first." };
  const ownerId = await getWorkspaceOwnerId(user);

  // Receivables are the required dataset. safeSelect swallows a missing-table /
  // RLS error and returns null; an empty workspace returns []. Either way we
  // fall back to the demo seed (matches the web view's `receivables.length`).
  const rcvRows = await safeSelect(
    () => supabase
      .from("receivables")
      .select("*")
      .or(`owner_id.eq.${ownerId},owner_id.is.null`)
      .order("expected_pay_date", { ascending: true }),
    null
  );
  if (!rcvRows || !rcvRows.length) {
    return { ok: false, error: "No live cash-position data." };
  }

  // Settlements + config are best-effort; empty on error.
  const [settlementRows, configRows] = await Promise.all([
    safeSelect(
      () => supabase
        .from("driver_settlements")
        .select("*")
        .or(`owner_id.eq.${ownerId},owner_id.is.null`)
        .order("created_at", { ascending: false }),
      []
    ),
    safeSelect(
      () => supabase.from("financing_config").select("owner_id, advance_rate, fee_rate"),
      []
    ),
  ]);

  return {
    ok: true,
    receivables: rcvRows.map(fromReceivable),
    driverSettlements: settlementRows.map(fromSettlement),
    financingRates: pickRates(configRows, ownerId),
  };
}

export async function extractReceiptInfo({ imageBase64, contentType = "image/jpeg" }) {
  if (!imageBase64) return { ok: false, error: "Choose or take a receipt photo first." };

  const { data, error } = await supabase.functions.invoke("parse-receipt", {
    body: {
      imageBase64,
      contentType,
    },
  });

  if (error) {
    return {
      ok: false,
      error: "Receipt AI is not connected yet. Deploy the parse-receipt Supabase function, then try again.",
    };
  }

  return {
    ok: true,
    receipt: {
      expenseType: data?.expenseType || "Other",
      vendor: data?.vendor || "",
      amount: data?.amount ? String(data.amount) : "",
      notes: data?.notes || "",
      confidence: data?.confidence || 0,
    },
  };
}
