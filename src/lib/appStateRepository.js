import { isSupabaseConfigured, supabase } from "./supabaseClient";

const getAppStateKey = async () => {
  const { data } = await supabase.auth.getUser();
  return data?.user?.id ? `user:${data.user.id}` : "demo-business";
};

export const loadAppStateFromSupabase = async () => {
  if (!isSupabaseConfigured || !supabase) {
    return { ok: false, state: null, error: "Supabase is not configured." };
  }

  const stateKey = await getAppStateKey();
  const { data, error } = await supabase
    .from("app_state")
    .select("state, updated_at")
    .eq("state_key", stateKey)
    .maybeSingle();

  if (error) return { ok: false, state: null, error: error.message };
  return { ok: true, state: data?.state || null, updatedAt: data?.updated_at || null };
};

export const saveAppStateToSupabase = async (state) => {
  if (!isSupabaseConfigured || !supabase) {
    return { ok: false, error: "Supabase is not configured." };
  }

  const stateKey = await getAppStateKey();
  const { data: userData } = await supabase.auth.getUser();
  const { error } = await supabase
    .from("app_state")
    .upsert(
      {
        state_key: stateKey,
        owner_id: userData?.user?.id || null,
        state,
        updated_at: new Date().toISOString(),
      },
      { onConflict: "state_key" }
    );

  if (error) return { ok: false, error: error.message };
  return { ok: true };
};
