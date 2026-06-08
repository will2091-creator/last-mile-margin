-- ===========================================================================
-- New-user workspace provisioning (CLH → FMM handoff support)
-- ===========================================================================
-- STATUS: INSTALLED AND LIVE (2026-06-08).
-- Verified schema before writing this trigger — see column list below.
-- No prior trigger existed on auth.users; installed cleanly.
--
-- WHAT IT DOES:
--   For every new auth.users INSERT (new signup on either CLH or FMM):
--     1. Creates a companies row (name = "<full_name>'s Business")
--     2. Creates a profiles row linked to that company (role = 'owner')
--     3. Creates an owner team_memberships row
--   This ensures CLH-originated accounts land in a working FMM workspace.
--   FMM's own app_state row is still created lazily on first save (no change).
--
-- VERIFIED LIVE SCHEMA (2026-06-08):
--   companies:        id (uuid, PK, gen_random_uuid()), name (text, NOT NULL), created_at
--   profiles:         id (uuid, PK), company_id (uuid, NULLABLE), full_name (text),
--                     role (text, NOT NULL, default 'owner'), created_at
--   team_memberships: id (uuid, PK), owner_id (uuid), user_id (uuid),
--                     email (text, NOT NULL), display_name, role, status,
--                     created_at, updated_at
--   UNIQUE on team_memberships(owner_id, email)
--
-- NOTE: The docs/supabase-team-access.sql schema file describes profiles with
-- (id, email, display_name) — this DOES NOT match the live DB. The live schema
-- uses (id, company_id, full_name, role). Do not run that file as-is.
--
-- SAFE PROPERTIES:
--   * Fires only on INSERT → existing users unaffected.
--   * ON CONFLICT DO NOTHING on profiles and team_memberships → idempotent.
--   * lock_timeout = 5s → trigger can never block FMM logins.
--   * SECURITY DEFINER → can write through RLS.
-- ===========================================================================

create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  v_company_id uuid;
  v_full_name   text;
  v_email       text;
begin
  set local lock_timeout = '5s';

  v_email     := coalesce(new.email, '');
  v_full_name := coalesce(
    nullif(trim(new.raw_user_meta_data ->> 'full_name'), ''),
    split_part(v_email, '@', 1)
  );

  -- 1. Create a company workspace for this user
  insert into public.companies (name)
  values (v_full_name || '''s Business')
  returning id into v_company_id;

  -- 2. Create the user profile linked to that company
  insert into public.profiles (id, company_id, full_name, role)
  values (new.id, v_company_id, v_full_name, 'owner')
  on conflict (id) do nothing;

  -- 3. Create an owner team membership (required for FMM team access)
  insert into public.team_memberships (owner_id, user_id, email, display_name, role, status)
  values (new.id, new.id, v_email, v_full_name, 'owner', 'active')
  on conflict (owner_id, email) do nothing;

  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

notify pgrst, 'reload schema';
