import { isSupabaseConfigured, supabase } from "./supabaseClient";

const TEAM_PHOTOS_BUCKET = "team-photos";
const SIGNED_URL_SECONDS = 60 * 60;

const getSafeFileName = (fileName) => String(fileName || "team-photo.jpg").replace(/[^a-zA-Z0-9._-]/g, "-");

const getPersonKey = (personRole) => (String(personRole || "").toLowerCase().includes("helper") ? "helper" : "lead");

export const uploadTeamPhoto = async ({ person, file }) => {
  if (!isSupabaseConfigured || !supabase) {
    return { ok: false, error: "Supabase is not configured." };
  }

  const { data: userData, error: userError } = await supabase.auth.getUser();
  if (userError) return { ok: false, error: userError.message };
  const user = userData?.user;
  if (!user) return { ok: false, error: "Sign in before uploading team photos." };

  const personKey = getPersonKey(person.role);
  const uploadedAt = new Date();
  const expiresAt = new Date(uploadedAt.getTime() + 7 * 24 * 60 * 60 * 1000);
  const safeName = getSafeFileName(file.name);
  const filePath = `${user.id}/${person.teamId}/${personKey}/${Date.now()}-${safeName}`;

  const { error: uploadError } = await supabase.storage
    .from(TEAM_PHOTOS_BUCKET)
    .upload(filePath, file, {
      contentType: file.type || "image/jpeg",
      upsert: false,
    });

  if (uploadError) return { ok: false, error: uploadError.message };

  const { data, error } = await supabase
    .from("team_photos")
    .insert({
      owner_id: user.id,
      team_id: person.teamId,
      team_name: person.teamName,
      person_name: person.name,
      person_role: person.role,
      person_key: personKey,
      file_path: filePath,
      file_name: file.name || safeName,
      file_type: file.type || "image/jpeg",
      uploaded_at: uploadedAt.toISOString(),
      expires_at: expiresAt.toISOString(),
    })
    .select("*")
    .single();

  if (error) return { ok: false, error: error.message };

  const { data: signed } = await supabase.storage
    .from(TEAM_PHOTOS_BUCKET)
    .createSignedUrl(filePath, SIGNED_URL_SECONDS);

  return {
    ok: true,
    photo: {
      ...data,
      signedUrl: signed?.signedUrl || "",
    },
  };
};

export const loadActiveTeamPhotos = async () => {
  if (!isSupabaseConfigured || !supabase) {
    return { ok: false, photos: [], error: "Supabase is not configured." };
  }

  const { data: userData, error: userError } = await supabase.auth.getUser();
  if (userError) return { ok: false, photos: [], error: userError.message };
  const user = userData?.user;
  if (!user) return { ok: false, photos: [], error: "Sign in before loading team photos." };

  await supabase.rpc("cleanup_expired_team_photos").throwOnError().catch(() => null);

  const { data, error } = await supabase
    .from("team_photos")
    .select("*")
    .eq("owner_id", user.id)
    .gt("expires_at", new Date().toISOString())
    .order("uploaded_at", { ascending: false });

  if (error) return { ok: false, photos: [], error: error.message };

  const latestByPerson = new Map();
  for (const photo of data || []) {
    const key = `${photo.team_id}:${photo.person_key}`;
    if (!latestByPerson.has(key)) latestByPerson.set(key, photo);
  }

  const photos = await Promise.all(
    [...latestByPerson.values()].map(async (photo) => {
      const { data: signed } = await supabase.storage
        .from(TEAM_PHOTOS_BUCKET)
        .createSignedUrl(photo.file_path, SIGNED_URL_SECONDS);

      return {
        ...photo,
        signedUrl: signed?.signedUrl || "",
      };
    })
  );

  return { ok: true, photos };
};
