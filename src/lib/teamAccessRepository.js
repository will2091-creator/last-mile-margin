import { isSupabaseConfigured, supabase } from "./supabaseClient";

export const roleOptions = [
  { value: "owner", label: "Owner", description: "Full control of settings, billing, users, and data." },
  { value: "admin", label: "Admin", description: "Manage most business data and daily workflows." },
  { value: "dispatcher", label: "Dispatcher", description: "Manage claims, routes, intake, and daily operations." },
  { value: "driver", label: "Driver", description: "Limited access for route work and evidence uploads." },
];

const normalizeEmail = (email) => String(email || "").trim().toLowerCase();

const toTeamMember = (row) => ({
  id: row.id,
  email: row.email || row.profiles?.email || "",
  name: row.display_name || row.profiles?.display_name || "",
  role: row.role || "driver",
  status: row.status || "pending",
  createdAt: row.created_at || "",
});

const getCurrentUser = async () => {
  if (!isSupabaseConfigured || !supabase) {
    return { ok: false, user: null, error: "Supabase is not configured." };
  }

  const { data, error } = await supabase.auth.getUser();
  if (error) return { ok: false, user: null, error: error.message };
  if (!data?.user) return { ok: false, user: null, error: "No signed-in user." };
  return { ok: true, user: data.user };
};

const upsertProfile = async (user) => {
  const displayName = user.user_metadata?.full_name || user.email?.split("@")[0] || "Owner";
  const { error } = await supabase.from("profiles").upsert(
    {
      id: user.id,
      email: normalizeEmail(user.email),
      display_name: displayName,
      updated_at: new Date().toISOString(),
    },
    { onConflict: "id" }
  );

  return error ? error.message : "";
};

const ensureOwnerMembership = async (user) => {
  const email = normalizeEmail(user.email);
  const { error } = await supabase.from("team_memberships").upsert(
    {
      owner_id: user.id,
      user_id: user.id,
      email,
      display_name: user.user_metadata?.full_name || email.split("@")[0] || "Owner",
      role: "owner",
      status: "active",
      updated_at: new Date().toISOString(),
    },
    { onConflict: "owner_id,email" }
  );

  return error ? error.message : "";
};

export const loadTeamAccess = async () => {
  const userResult = await getCurrentUser();
  if (!userResult.ok) return { ok: false, members: [], currentRole: "owner", error: userResult.error };

  const profileError = await upsertProfile(userResult.user);
  const ownerError = await ensureOwnerMembership(userResult.user);
  if (profileError || ownerError) {
    return {
      ok: false,
      members: [],
      currentRole: "owner",
      error: profileError || ownerError,
    };
  }

  const { data, error } = await supabase
    .from("team_memberships")
    .select("id,email,display_name,role,status,created_at,user_id,profiles:profiles!team_memberships_user_id_fkey(email,display_name)")
    .eq("owner_id", userResult.user.id)
    .order("created_at", { ascending: true });

  if (error) return { ok: false, members: [], currentRole: "owner", error: error.message };

  const members = (data || []).map(toTeamMember);
  const currentMember = members.find((member) => normalizeEmail(member.email) === normalizeEmail(userResult.user.email));

  return {
    ok: true,
    members,
    currentRole: currentMember?.role || "owner",
    error: "",
  };
};

export const addTeamMember = async ({ email, role }) => {
  const userResult = await getCurrentUser();
  if (!userResult.ok) return { ok: false, member: null, error: userResult.error };

  const cleanEmail = normalizeEmail(email);
  if (!cleanEmail || !cleanEmail.includes("@")) {
    return { ok: false, member: null, error: "Enter a valid email address." };
  }

  const selectedRole = roleOptions.some((option) => option.value === role) ? role : "driver";
  const { data, error } = await supabase
    .from("team_memberships")
    .upsert(
      {
        owner_id: userResult.user.id,
        email: cleanEmail,
        role: selectedRole,
        status: "pending",
        updated_at: new Date().toISOString(),
      },
      { onConflict: "owner_id,email" }
    )
    .select("id,email,display_name,role,status,created_at")
    .single();

  if (error) return { ok: false, member: null, error: error.message };
  return { ok: true, member: toTeamMember(data), error: "" };
};

export const updateTeamMemberRole = async ({ memberId, role }) => {
  const selectedRole = roleOptions.some((option) => option.value === role) ? role : "driver";
  const { data, error } = await supabase
    .from("team_memberships")
    .update({ role: selectedRole, updated_at: new Date().toISOString() })
    .eq("id", memberId)
    .select("id,email,display_name,role,status,created_at")
    .single();

  if (error) return { ok: false, member: null, error: error.message };
  return { ok: true, member: toTeamMember(data), error: "" };
};
