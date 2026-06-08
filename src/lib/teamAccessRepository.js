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

// When the team-access backend isn't fully provisioned, a solo owner should still work
// silently — treat them as the sole "owner" member rather than surfacing a raw DB error.
const ownerFallback = (user) => ({
  ok: true,
  members: [
    {
      id: user.id,
      email: normalizeEmail(user.email),
      name: user.user_metadata?.full_name || user.email?.split("@")[0] || "Owner",
      role: "owner",
      status: "active",
      createdAt: "",
    },
  ],
  currentRole: "owner",
  error: "",
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
  const fullName = user.user_metadata?.full_name || user.email?.split("@")[0] || "Owner";
  // The live `profiles` table is { id, company_id, full_name, role, created_at }. Touch only
  // a column that exists (full_name), and UPDATE in place (never insert) so a NOT NULL
  // company_id on a missing row can't fail this. Best-effort — must not block team access.
  const { error } = await supabase.from("profiles").update({ full_name: fullName }).eq("id", user.id);
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

  // Best-effort profile sync — a failure here must never block team access.
  const profileError = await upsertProfile(userResult.user);
  if (profileError) console.warn("Profile sync skipped:", profileError);

  const userEmail = normalizeEmail(userResult.user.email);
  const { data: membershipRows, error: membershipError } = await supabase
    .from("team_memberships")
    .select("id,owner_id,email,display_name,role,status,created_at,user_id")
    .or(`user_id.eq.${userResult.user.id},email.eq.${userEmail}`)
    .order("created_at", { ascending: true });

  if (membershipError) return ownerFallback(userResult.user);

  let currentMembership = (membershipRows || []).find((row) => row.user_id === userResult.user.id)
    || (membershipRows || []).find((row) => normalizeEmail(row.email) === userEmail && row.status === "active")
    || (membershipRows || []).find((row) => normalizeEmail(row.email) === userEmail);

  if (!currentMembership) {
    const ownerError = await ensureOwnerMembership(userResult.user);
    if (ownerError) return ownerFallback(userResult.user);

    currentMembership = {
      owner_id: userResult.user.id,
      email: userEmail,
      role: "owner",
      status: "active",
      user_id: userResult.user.id,
    };
  }

  const workspaceOwnerId = currentMembership.owner_id || userResult.user.id;

  const { data, error } = await supabase
    .from("team_memberships")
    .select("id,email,display_name,role,status,created_at,user_id")
    .eq("owner_id", workspaceOwnerId)
    .order("created_at", { ascending: true });

  if (error) return ownerFallback(userResult.user);

  const members = (data || []).map(toTeamMember);
  const currentMember = members.find((member) => member.id === currentMembership.id)
    || members.find((member) => normalizeEmail(member.email) === userEmail);

  return {
    ok: true,
    members,
    currentRole: currentMember?.role || currentMembership.role || "driver",
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
