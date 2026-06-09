import { isSupabaseConfigured, supabase } from "./supabaseClient";

// Claim evidence files live in the private `claim-evidence` storage bucket and
// are indexed in the `claim_evidence` table. Claims carry an app-level string
// id (e.g. "CLM-100"), recorded in app_claim_id. Mirrors documentRepository.

const EVIDENCE_BUCKET = "claim-evidence";

const getFileExtension = (fileName) => {
  const extension = fileName.split(".").pop();
  return extension && extension !== fileName ? extension : "file";
};

export const uploadClaimEvidence = async ({ file, appClaimId, label }) => {
  if (!isSupabaseConfigured || !supabase) {
    return { ok: false, error: "Supabase is not configured." };
  }

  const { data: userData, error: userError } = await supabase.auth.getUser();
  if (userError) return { ok: false, error: userError.message };
  const user = userData?.user;
  if (!user) return { ok: false, error: "Sign in before uploading evidence." };

  const safeName = file.name.replace(/[^a-zA-Z0-9._-]/g, "-");
  const filePath = `${user.id}/${appClaimId || "unfiled"}/${Date.now()}-${crypto.randomUUID()}.${getFileExtension(safeName)}`;

  const { error: uploadError } = await supabase.storage
    .from(EVIDENCE_BUCKET)
    .upload(filePath, file, {
      contentType: file.type || "application/octet-stream",
      upsert: false,
    });
  if (uploadError) return { ok: false, error: uploadError.message };

  const { data, error } = await supabase
    .from("claim_evidence")
    .insert({
      owner_id: user.id,
      app_claim_id: appClaimId || null,
      name: file.name,
      file_path: filePath,
      file_type: file.type || "",
      notes: label || null,
    })
    .select("*")
    .single();

  if (error) return { ok: false, error: error.message };
  return { ok: true, evidence: data };
};

export const loadClaimEvidence = async (appClaimId) => {
  if (!isSupabaseConfigured || !supabase || !appClaimId) {
    return { ok: false, evidence: [] };
  }
  const { data: userData } = await supabase.auth.getUser();
  if (!userData?.user) return { ok: false, evidence: [] };

  const { data, error } = await supabase
    .from("claim_evidence")
    .select("*")
    .eq("app_claim_id", appClaimId)
    .order("created_at", { ascending: false });

  if (error) return { ok: false, evidence: [], error: error.message };
  return { ok: true, evidence: data || [] };
};
