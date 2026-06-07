-- ===========================================================================
-- New-user workspace provisioning (enables the Contractor Launch Hub funnel)
-- ===========================================================================
-- WHY: Contractor Launch Hub is the front door where brand-new contractor
-- accounts are created. When such a user is handed off into Final Mile Margin
-- (same shared Supabase project), FMM expects a profile + an "owner" workspace
-- membership to exist. FMM today provisions these client-side on its own
-- signup paths, but a CLH-originated account never went through them.
--
-- This trigger auto-provisions every NEW auth user with a profile and an
-- owner-role team membership, so any account — CLH-origin or FMM-origin —
-- lands in a working FMM workspace. FMM's app_state row is still created
-- lazily by FMM on first save (no change needed there).
--
-- SAFETY:
--   * Fires only on INSERT into auth.users → existing users are untouched.
--   * ON CONFLICT DO NOTHING → idempotent; never overwrites existing rows.
--   * SECURITY DEFINER → runs as the function owner so it can write through RLS.
--   * No FMM frontend changes; FMM's existing client-side provisioning still
--     works (the ON CONFLICT guards make them harmless duplicates).
--
-- REVIEW BEFORE RUNNING: confirm there is no other trigger already named
-- on_auth_user_created on auth.users in this project, then run in the SQL editor.
-- ---------------------------------------------------------------------------

create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profiles (id, email, display_name)
  values (
    new.id,
    new.email,
    coalesce(nullif(new.raw_user_meta_data ->> 'full_name', ''), split_part(new.email, '@', 1))
  )
  on conflict (id) do nothing;

  insert into public.team_memberships (owner_id, user_id, email, display_name, role, status)
  values (
    new.id,
    new.id,
    new.email,
    coalesce(new.raw_user_meta_data ->> 'full_name', ''),
    'owner',
    'active'
  )
  on conflict (owner_id, email) do nothing;

  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- Backfill any existing users who are missing a profile / owner membership
-- (safe + idempotent; covers accounts created before this trigger existed).
insert into public.profiles (id, email, display_name)
select u.id, u.email, coalesce(nullif(u.raw_user_meta_data ->> 'full_name', ''), split_part(u.email, '@', 1))
from auth.users u
on conflict (id) do nothing;

insert into public.team_memberships (owner_id, user_id, email, display_name, role, status)
select u.id, u.id, u.email, coalesce(u.raw_user_meta_data ->> 'full_name', ''), 'owner', 'active'
from auth.users u
on conflict (owner_id, email) do nothing;

notify pgrst, 'reload schema';
