import { isSupabaseConfigured, supabase } from "./supabaseClient";

const toSupabaseClaim = (claim, ownerId) => ({
  app_claim_id: claim.id,
  owner_id: ownerId || null,
  claim_number: claim.id,
  category: claim.category || "Property",
  type: claim.type || "Claim",
  amount: Number(claim.amount || 0),
  driver: claim.driver || "",
  team: claim.team || "",
  route: claim.route || "",
  status: claim.status || "Under Review",
  preventable: claim.preventable || "Maybe",
  risk: claim.risk || "Low",
  claim_date: claim.date || "",
  notes: claim.notes || "",
  source_type: claim.sourceType || claim.source_type || "",
  updated_at: new Date().toISOString(),
});

const fromSupabaseClaim = (row) => ({
  id: row.app_claim_id || row.claim_number || row.id,
  category: row.category || "Property",
  type: row.type || "Claim",
  amount: Number(row.amount || 0),
  driver: row.driver || "",
  team: row.team || "",
  route: row.route || "",
  status: row.status || "Under Review",
  preventable: row.preventable || "Maybe",
  risk: row.risk || "Low",
  date: row.claim_date || "Today",
  notes: row.notes || "",
  sourceType: row.source_type || "",
});

export const loadClaimsFromSupabase = async () => {
  if (!isSupabaseConfigured || !supabase) {
    return { ok: false, claims: [], error: "Supabase is not configured." };
  }

  const { data: userData } = await supabase.auth.getUser();
  const ownerId = userData?.user?.id;
  let query = supabase
    .from("claims")
    .select("*")
    .order("created_at", { ascending: false });

  if (ownerId) {
    query = query.or(`owner_id.eq.${ownerId},owner_id.is.null`);
  }

  const { data, error } = await query;

  if (error) return { ok: false, claims: [], error: error.message };
  return { ok: true, claims: (data || []).map(fromSupabaseClaim) };
};

export const syncClaimsToSupabase = async ({ previousClaims, nextClaims }) => {
  if (!isSupabaseConfigured || !supabase) {
    return { ok: false, error: "Supabase is not configured." };
  }

  const previousIds = new Set(previousClaims.map((claim) => claim.id));
  const nextIds = new Set(nextClaims.map((claim) => claim.id));
  const removedIds = [...previousIds].filter((id) => !nextIds.has(id));
  const { data: userData } = await supabase.auth.getUser();
  const ownerId = userData?.user?.id;

  if (nextClaims.length) {
    const { error } = await supabase
      .from("claims")
      .upsert(nextClaims.map((claim) => toSupabaseClaim(claim, ownerId)), { onConflict: "app_claim_id" });

    if (error) return { ok: false, error: error.message };
  }

  if (removedIds.length) {
    const { error } = await supabase
      .from("claims")
      .delete()
      .in("app_claim_id", removedIds);

    if (error) return { ok: false, error: error.message };
  }

  return { ok: true };
};
