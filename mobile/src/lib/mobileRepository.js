import { supabase } from "./supabaseClient";

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
    .select("id,app_claim_id,category,type,team,driver,route,amount,status,preventable,date,risk,owner_id")
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
    })),
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
  return { ok: true, membership: data };
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
