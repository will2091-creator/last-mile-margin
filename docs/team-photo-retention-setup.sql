-- Team route/readiness photos.
-- Photos are stored in the private `team-photos` bucket and tracked in `team_photos`.
-- Each row expires after 7 days. The cleanup function removes expired database rows
-- and storage objects.

insert into storage.buckets (id, name, public)
values ('team-photos', 'team-photos', false)
on conflict (id) do nothing;

create table if not exists public.team_photos (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid references auth.users(id) on delete cascade,
  team_id text not null,
  team_name text,
  person_name text not null,
  person_role text not null,
  person_key text not null check (person_key in ('lead', 'helper')),
  file_path text not null,
  file_name text,
  file_type text,
  uploaded_at timestamptz not null default now(),
  expires_at timestamptz not null default (now() + interval '7 days')
);

create index if not exists team_photos_owner_expires_idx
on public.team_photos (owner_id, expires_at);

create index if not exists team_photos_person_idx
on public.team_photos (owner_id, team_id, person_key, uploaded_at desc);

alter table public.team_photos enable row level security;

drop policy if exists "Users can manage own team photos" on public.team_photos;
create policy "Users can manage own team photos"
on public.team_photos
for all
to authenticated
using (owner_id = auth.uid())
with check (owner_id = auth.uid());

drop policy if exists "Users can upload own team photo files" on storage.objects;
create policy "Users can upload own team photo files"
on storage.objects
for insert
to authenticated
with check (bucket_id = 'team-photos' and owner = auth.uid());

drop policy if exists "Users can read own team photo files" on storage.objects;
create policy "Users can read own team photo files"
on storage.objects
for select
to authenticated
using (bucket_id = 'team-photos' and owner = auth.uid());

drop policy if exists "Users can delete own team photo files" on storage.objects;
create policy "Users can delete own team photo files"
on storage.objects
for delete
to authenticated
using (bucket_id = 'team-photos' and owner = auth.uid());

create or replace function public.cleanup_expired_team_photos()
returns integer
language plpgsql
security definer
set search_path = public, storage
as $$
declare
  deleted_count integer := 0;
begin
  delete from storage.objects
  where bucket_id = 'team-photos'
    and name in (
      select file_path
      from public.team_photos
      where expires_at <= now()
    );

  delete from public.team_photos
  where expires_at <= now();

  get diagnostics deleted_count = row_count;
  return deleted_count;
end;
$$;

grant select, insert, update, delete on table public.team_photos to authenticated;
grant execute on function public.cleanup_expired_team_photos() to authenticated;

-- Optional automatic daily cleanup. Supabase projects may require enabling pg_cron first:
-- create extension if not exists pg_cron with schema extensions;
-- select cron.schedule(
--   'cleanup-expired-team-photos',
--   '15 3 * * *',
--   $$select public.cleanup_expired_team_photos();$$
-- );
