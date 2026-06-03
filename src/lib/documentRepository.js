import { isSupabaseConfigured, supabase } from "./supabaseClient";

const DOCUMENTS_BUCKET = "documents";

const getFileExtension = (fileName) => {
  const extension = fileName.split(".").pop();
  return extension && extension !== fileName ? extension : "file";
};

export const uploadVaultDocument = async ({ file, category, owner }) => {
  if (!isSupabaseConfigured || !supabase) {
    return { ok: false, error: "Supabase is not configured." };
  }

  const { data: userData, error: userError } = await supabase.auth.getUser();
  if (userError) return { ok: false, error: userError.message };
  const user = userData?.user;
  if (!user) return { ok: false, error: "Sign in before uploading documents." };

  const uploadedAt = new Date().toISOString();
  const safeName = file.name.replace(/[^a-zA-Z0-9._-]/g, "-");
  const filePath = `${user.id}/${Date.now()}-${crypto.randomUUID()}.${getFileExtension(safeName)}`;

  const { error: uploadError } = await supabase.storage
    .from(DOCUMENTS_BUCKET)
    .upload(filePath, file, {
      contentType: file.type || "application/octet-stream",
      upsert: false,
    });

  if (uploadError) return { ok: false, error: uploadError.message };

  const documentRow = {
    owner_id: user.id,
    name: file.name,
    category,
    required: false,
    status: "Uploaded",
    expiration: "N/A",
    owner,
    notes: `Uploaded ${new Date(uploadedAt).toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
    })}. ${file.type || "File"} · ${Math.max(1, Math.round(file.size / 1024))} KB.`,
    file_path: filePath,
    file_name: file.name,
    file_type: file.type || "",
    file_size: file.size || 0,
    uploaded_at: uploadedAt,
  };

  const { data, error } = await supabase
    .from("documents")
    .insert(documentRow)
    .select("*")
    .single();

  if (error) return { ok: false, error: error.message };
  return { ok: true, document: data };
};

export const loadVaultDocumentsFromSupabase = async () => {
  if (!isSupabaseConfigured || !supabase) {
    return { ok: false, documents: [], error: "Supabase is not configured." };
  }

  const { data: userData, error: userError } = await supabase.auth.getUser();
  if (userError) return { ok: false, documents: [], error: userError.message };
  if (!userData?.user) return { ok: false, documents: [], error: "Sign in before loading documents." };

  const { data, error } = await supabase
    .from("documents")
    .select("*")
    .order("uploaded_at", { ascending: false });

  if (error) return { ok: false, documents: [], error: error.message };
  return { ok: true, documents: data || [] };
};
