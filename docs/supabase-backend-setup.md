# Supabase Backend Setup

Project URL:

```text
https://eptoyxshbwglnnklqebl.supabase.co
```

Local frontend environment:

```bash
VITE_SUPABASE_URL=https://eptoyxshbwglnnklqebl.supabase.co
VITE_SUPABASE_ANON_KEY=your_publishable_key
```

Do not put the database password, direct connection string, or service role key in the frontend.

## Recommended First Tables

Start with these because they unlock the core app workflows:

1. `companies`
2. `profiles`
3. `claims`
4. `app_state`
5. `activity_log`

Documents and file storage should come next, after claims are working.

## First SQL Draft

Run this in Supabase SQL Editor when ready:

```sql
create table if not exists public.companies (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  created_at timestamptz not null default now()
);

create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  company_id uuid references public.companies(id) on delete set null,
  full_name text,
  role text not null default 'owner',
  created_at timestamptz not null default now()
);

create table if not exists public.claims (
  id uuid primary key default gen_random_uuid(),
  company_id uuid references public.companies(id) on delete cascade,
  app_claim_id text unique,
  claim_number text,
  category text not null default 'Property',
  type text not null,
  amount numeric not null default 0,
  driver text,
  team text,
  route text,
  status text not null default 'Under Review',
  preventable text not null default 'Maybe',
  risk text not null default 'Low',
  claim_date text,
  notes text,
  source_type text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.app_state (
  id uuid primary key default gen_random_uuid(),
  company_id uuid references public.companies(id) on delete cascade,
  state_key text not null unique,
  state jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.activity_log (
  id uuid primary key default gen_random_uuid(),
  company_id uuid references public.companies(id) on delete cascade,
  actor_id uuid references auth.users(id) on delete set null,
  action text not null,
  entity_type text,
  entity_id text,
  detail text,
  created_at timestamptz not null default now()
);

alter table public.companies enable row level security;
alter table public.profiles enable row level security;
alter table public.claims enable row level security;
alter table public.app_state enable row level security;
alter table public.activity_log enable row level security;
```

## Claims Sync Migration

If the `claims` table was created before `app_claim_id` was added, run this:

```sql
alter table public.claims
add column if not exists app_claim_id text;

create unique index if not exists claims_app_claim_id_key
on public.claims(app_claim_id);
```

## Temporary Development Policies

The app currently uses a local demo login, not Supabase Auth yet. That means it connects as `anon`, not `authenticated`.

For development only, run these policies so Claims can sync before real auth is added:

```sql
create policy "Dev anon can read claims"
on public.claims
for select
to anon
using (true);

create policy "Dev anon can insert claims"
on public.claims
for insert
to anon
with check (true);

create policy "Dev anon can update claims"
on public.claims
for update
to anon
using (true)
with check (true);

create policy "Dev anon can delete claims"
on public.claims
for delete
to anon
using (true);

create policy "Dev anon can read app state"
on public.app_state
for select
to anon
using (true);

create policy "Dev anon can insert app state"
on public.app_state
for insert
to anon
with check (true);

create policy "Dev anon can update app state"
on public.app_state
for update
to anon
using (true)
with check (true);
```

Because automatic table exposure was disabled during project setup, also grant the narrow table privileges needed by the frontend development key:

```sql
grant usage on schema public to anon;
grant select, insert, update, delete on table public.claims to anon;
grant select, insert, update on table public.app_state to anon;
```

When Supabase Auth is wired in, remove or replace these with company-scoped authenticated policies.

## Next Build Step

After the tables exist, wire the app in this order:

1. Read/write claims from Supabase. Done.
2. Keep local fallback if Supabase is unavailable. Done.
3. Sync app settings, teams, saved days, and saved scenarios with `app_state`. Done in the app; run the SQL above if Supabase reports `app_state` is missing.
4. Add auth/profile lookup.
5. Add activity log entries for claim saves/status changes.
6. Add document storage bucket and vault file uploads.

## Cash Position (financial system-of-record)

The Cash Position dashboard (Finance → Cash Position) is backed by a separate,
additive migration: [`supabase-cash-position.sql`](./supabase-cash-position.sql).
Run it in the Supabase SQL Editor after the tables above exist. It adds:

- `receivables`, `driver_settlements`, `settlement_lines`, and an append-only
  `financial_events` ledger — all bigint cents, `owner_id = auth.uid()` RLS
  (matching `claims`), with a `financing_config` table for the early-pay rates.
- A `cash_position_receivables_aging` view plus `get_cash_position_summary()`
  and `get_early_pay_preview()` RPCs (preview-only — they move no money).
- Seed rows so local dev renders immediately.

Until it is run, the dashboard renders from a local mock seed
(`src/data/cashPositionMockData.js`) via the same graceful-fallback path as
claims. The file is idempotent and ships with a commented rollback block.
Reserved `advance_id` columns are where the future payments/advances layer
attaches.

## Auth, Storage, and Full MVP Tables

Run this after enabling Supabase Auth. It keeps the current development access working, but adds authenticated owner scoping for the real login and mobile-ready data.

```sql
alter table public.claims
add column if not exists owner_id uuid references auth.users(id) on delete set null;

alter table public.app_state
add column if not exists owner_id uuid references auth.users(id) on delete set null;

create table if not exists public.documents (
  id uuid primary key default gen_random_uuid(),
  company_id uuid references public.companies(id) on delete cascade,
  owner_id uuid references auth.users(id) on delete set null,
  name text not null,
  category text not null default 'Other Documents',
  required boolean not null default false,
  status text not null default 'Uploaded',
  expiration text,
  owner text,
  notes text,
  file_path text,
  file_name text,
  file_type text,
  file_size bigint,
  uploaded_at timestamptz not null default now(),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.contracts (
  id uuid primary key default gen_random_uuid(),
  company_id uuid references public.companies(id) on delete cascade,
  owner_id uuid references auth.users(id) on delete set null,
  name text not null,
  customer text,
  status text,
  payload jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.rate_cards (
  id uuid primary key default gen_random_uuid(),
  company_id uuid references public.companies(id) on delete cascade,
  owner_id uuid references auth.users(id) on delete set null,
  contract_id uuid references public.contracts(id) on delete cascade,
  name text not null,
  payload jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.claim_evidence (
  id uuid primary key default gen_random_uuid(),
  company_id uuid references public.companies(id) on delete cascade,
  owner_id uuid references auth.users(id) on delete set null,
  claim_id uuid references public.claims(id) on delete cascade,
  app_claim_id text,
  name text not null,
  file_path text,
  file_type text,
  notes text,
  created_at timestamptz not null default now()
);

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

alter table public.documents enable row level security;
alter table public.contracts enable row level security;
alter table public.rate_cards enable row level security;
alter table public.claim_evidence enable row level security;
alter table public.team_photos enable row level security;

insert into storage.buckets (id, name, public)
values
  ('documents', 'documents', false),
  ('claim-evidence', 'claim-evidence', false),
  ('team-photos', 'team-photos', false),
  ('contracts', 'contracts', false)
on conflict (id) do nothing;

create policy "Users can read own claims"
on public.claims
for select
to authenticated
using (owner_id = auth.uid() or owner_id is null);

create policy "Users can insert own claims"
on public.claims
for insert
to authenticated
with check (owner_id = auth.uid());

create policy "Users can update own claims"
on public.claims
for update
to authenticated
using (owner_id = auth.uid() or owner_id is null)
with check (owner_id = auth.uid());

create policy "Users can delete own claims"
on public.claims
for delete
to authenticated
using (owner_id = auth.uid());

create policy "Users can read own app state"
on public.app_state
for select
to authenticated
using (owner_id = auth.uid() or owner_id is null);

create policy "Users can insert own app state"
on public.app_state
for insert
to authenticated
with check (owner_id = auth.uid());

create policy "Users can update own app state"
on public.app_state
for update
to authenticated
using (owner_id = auth.uid() or owner_id is null)
with check (owner_id = auth.uid());

create policy "Users can manage own documents"
on public.documents
for all
to authenticated
using (owner_id = auth.uid())
with check (owner_id = auth.uid());

create policy "Users can manage own contracts"
on public.contracts
for all
to authenticated
using (owner_id = auth.uid())
with check (owner_id = auth.uid());

create policy "Users can manage own rate cards"
on public.rate_cards
for all
to authenticated
using (owner_id = auth.uid())
with check (owner_id = auth.uid());

create policy "Users can manage own claim evidence"
on public.claim_evidence
for all
to authenticated
using (owner_id = auth.uid())
with check (owner_id = auth.uid());

create policy "Users can manage own team photos"
on public.team_photos
for all
to authenticated
using (owner_id = auth.uid())
with check (owner_id = auth.uid());

create policy "Users can upload own document files"
on storage.objects
for insert
to authenticated
with check (bucket_id in ('documents', 'claim-evidence', 'team-photos', 'contracts') and owner = auth.uid());

create policy "Users can read own document files"
on storage.objects
for select
to authenticated
using (bucket_id in ('documents', 'claim-evidence', 'team-photos', 'contracts') and owner = auth.uid());

create policy "Users can update own document files"
on storage.objects
for update
to authenticated
using (bucket_id in ('documents', 'claim-evidence', 'team-photos', 'contracts') and owner = auth.uid())
with check (bucket_id in ('documents', 'claim-evidence', 'team-photos', 'contracts') and owner = auth.uid());

create policy "Users can delete own document files"
on storage.objects
for delete
to authenticated
using (bucket_id in ('documents', 'claim-evidence', 'team-photos', 'contracts') and owner = auth.uid());

grant select, insert, update, delete on table public.documents to authenticated;
grant select, insert, update, delete on table public.contracts to authenticated;
grant select, insert, update, delete on table public.rate_cards to authenticated;
grant select, insert, update, delete on table public.claim_evidence to authenticated;
grant select, insert, update, delete on table public.team_photos to authenticated;
grant select, insert, update, delete on table public.claims to authenticated;
grant select, insert, update on table public.app_state to authenticated;

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

grant execute on function public.cleanup_expired_team_photos() to authenticated;

notify pgrst, 'reload schema';
```
