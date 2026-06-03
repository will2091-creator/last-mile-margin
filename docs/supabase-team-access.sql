create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  email text not null,
  display_name text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.team_memberships (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null references auth.users(id) on delete cascade,
  user_id uuid references public.profiles(id) on delete set null,
  email text not null,
  display_name text,
  role text not null default 'driver',
  status text not null default 'pending',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint team_memberships_role_check check (role in ('owner', 'admin', 'dispatcher', 'driver')),
  constraint team_memberships_status_check check (status in ('active', 'pending', 'disabled')),
  constraint team_memberships_owner_email_unique unique (owner_id, email)
);

create index if not exists team_memberships_owner_id_idx on public.team_memberships(owner_id);
create index if not exists team_memberships_user_id_idx on public.team_memberships(user_id);
create index if not exists team_memberships_email_idx on public.team_memberships(email);

alter table public.profiles enable row level security;
alter table public.team_memberships enable row level security;

create or replace function public.can_manage_team(target_owner_id uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select
    auth.uid() = target_owner_id
    or exists (
      select 1
      from public.team_memberships tm
      where tm.owner_id = target_owner_id
        and tm.user_id = auth.uid()
        and tm.status = 'active'
        and tm.role in ('owner', 'admin')
    );
$$;

drop policy if exists "profiles_select_own_or_team" on public.profiles;
create policy "profiles_select_own_or_team"
on public.profiles
for select
to authenticated
using (
  id = auth.uid()
  or exists (
    select 1
    from public.team_memberships tm
    where tm.user_id = profiles.id
      and public.can_manage_team(tm.owner_id)
  )
);

drop policy if exists "profiles_upsert_own" on public.profiles;
create policy "profiles_upsert_own"
on public.profiles
for insert
to authenticated
with check (id = auth.uid());

drop policy if exists "profiles_update_own" on public.profiles;
create policy "profiles_update_own"
on public.profiles
for update
to authenticated
using (id = auth.uid())
with check (id = auth.uid());

drop policy if exists "team_memberships_select_workspace" on public.team_memberships;
create policy "team_memberships_select_workspace"
on public.team_memberships
for select
to authenticated
using (
  public.can_manage_team(owner_id)
  or user_id = auth.uid()
  or lower(email) = lower(coalesce((auth.jwt() ->> 'email'), ''))
);

drop policy if exists "team_memberships_insert_managers" on public.team_memberships;
create policy "team_memberships_insert_managers"
on public.team_memberships
for insert
to authenticated
with check (public.can_manage_team(owner_id));

drop policy if exists "team_memberships_update_managers" on public.team_memberships;
create policy "team_memberships_update_managers"
on public.team_memberships
for update
to authenticated
using (public.can_manage_team(owner_id))
with check (public.can_manage_team(owner_id));

grant usage on schema public to authenticated;
grant select, insert, update on public.profiles to authenticated;
grant select, insert, update on public.team_memberships to authenticated;
grant execute on function public.can_manage_team(uuid) to authenticated;

notify pgrst, 'reload schema';
