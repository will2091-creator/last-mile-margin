create table if not exists public.route_checkins (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid references auth.users(id) on delete cascade,
  user_id uuid references auth.users(id) on delete set null,
  route_name text,
  truck text,
  notes text,
  photo_url text,
  created_at timestamptz not null default now()
);

alter table public.route_checkins enable row level security;

drop policy if exists "route_checkins_select_workspace" on public.route_checkins;
create policy "route_checkins_select_workspace"
on public.route_checkins
for select
to authenticated
using (
  owner_id = auth.uid()
  or user_id = auth.uid()
  or public.can_manage_team(owner_id)
);

drop policy if exists "route_checkins_insert_own" on public.route_checkins;
create policy "route_checkins_insert_own"
on public.route_checkins
for insert
to authenticated
with check (
  owner_id = auth.uid()
  or user_id = auth.uid()
  or public.can_manage_team(owner_id)
);

drop policy if exists "route_checkins_update_managers" on public.route_checkins;
create policy "route_checkins_update_managers"
on public.route_checkins
for update
to authenticated
using (public.can_manage_team(owner_id))
with check (public.can_manage_team(owner_id));

grant select, insert, update on public.route_checkins to authenticated;

notify pgrst, 'reload schema';
