-- =====================================================================
-- Cash Position — financial system-of-record (read-only analytics slice)
-- STATUS: DRAFT (additive, not yet run against live DB)
--
-- This is the "visibility / underwriting-brain" layer described in the
-- product roadmap: it records what a carrier is OWED (receivables) and what
-- it OWES its 1099 drivers (settlements), plus an append-only financial
-- ledger. NO money moves here. A future payments/advances layer attaches via
-- the reserved `advance_id` columns (see "FORWARD HOOKS" below) without a
-- schema rewrite.
--
-- Conventions match the rest of this repo (see docs/supabase-backend-setup.md):
--   * All statements are idempotent + additive (create ... if not exists,
--     add column if not exists, drop policy if exists -> create policy). They
--     can be re-run safely. A reversible rollback block is at the BOTTOM.
--   * Tenancy = per-user `owner_id = auth.uid()` (the live pattern used by
--     claims / app_state), tolerating `owner_id is null` for demo/pre-auth
--     rows. `company_id` is carried as the RESERVED org/carrier hook so a
--     future org-scoped rollup can switch scoping with no table churn.
--   * Money is ALWAYS bigint cents (never float, never currency-as-string).
--   * Timestamps are ALWAYS timestamptz (UTC).
--   * "Enums" follow the codebase convention: a plain `text` column + a named
--     CHECK constraint. New states are added later by ALTERING the check (an
--     additive change) — see the ADD-A-STATE note on each table.
--   * Run order: this file is standalone; run it AFTER docs/supabase-backend-
--     setup.md (it references public.companies and public.team_memberships).
--   * Ends with `notify pgrst, 'reload schema';` to refresh PostgREST.
-- =====================================================================

-- ---------------------------------------------------------------------
-- 0. Financing config — advance_rate / fee_rate live here, NOT hardcoded.
--    A single global default row uses owner_id = null; a carrier can later
--    override by inserting a row with their owner_id.
-- ---------------------------------------------------------------------
create table if not exists public.financing_config (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid references auth.users(id) on delete cascade,        -- null = global default
  company_id uuid references public.companies(id) on delete cascade, -- reserved org hook
  advance_rate numeric not null default 0.85 check (advance_rate >= 0 and advance_rate <= 1),
  fee_rate numeric not null default 0.02 check (fee_rate >= 0 and fee_rate <= 1),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
-- Exactly one global default row (owner_id is null).
create unique index if not exists financing_config_global_default_idx
  on public.financing_config ((owner_id is null)) where owner_id is null;
create unique index if not exists financing_config_owner_idx
  on public.financing_config (owner_id) where owner_id is not null;

insert into public.financing_config (id, owner_id, advance_rate, fee_rate)
values ('f0000000-0000-4000-8000-000000000001', null, 0.85, 0.02)
on conflict (id) do nothing;

-- ---------------------------------------------------------------------
-- 1. receivables — invoices the carrier is OWED by a broker/retailer.
--    Source refs are nullable text (this repo has no deliveries/manifests
--    tables to FK into yet — they live in client state). When those tables
--    land, add real FK columns alongside; these text refs stay valid.
-- ---------------------------------------------------------------------
create table if not exists public.receivables (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid references auth.users(id) on delete set null,
  company_id uuid references public.companies(id) on delete set null, -- reserved org hook
  payer_name text not null,                       -- e.g. "Lowe's", "Home Depot"
  source_contract_ref text,                       -- e.g. client contract id "LOWES-APPL"
  source_manifest_ref text,                       -- reserved: manifest/delivery batch id
  source_route text,                              -- e.g. "Syracuse Appliance"
  amount_cents bigint not null default 0 check (amount_cents >= 0),
  status text not null default 'pending'
    check (status in ('pending','completed','verified','invoiced','paid','disputed')),
  expected_pay_date date,
  paid_at timestamptz,                            -- null until collected
  -- FORWARD HOOK: reserved FK to a not-yet-built public.advances table.
  -- Left as a bare uuid (no FK) so this migration has no dependency on the
  -- future table; add `references public.advances(id)` when it exists.
  advance_id uuid,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
comment on column public.receivables.advance_id is
  'RESERVED for the future payments/advances layer. Nullable; no FK yet. When public.advances exists, add the FK without touching existing rows.';
-- ADD-A-STATE: alter table public.receivables drop constraint receivables_status_check,
--   then add it back including the new value.
create index if not exists receivables_owner_idx on public.receivables (owner_id);
create index if not exists receivables_status_idx on public.receivables (status);
create index if not exists receivables_expected_pay_date_idx on public.receivables (expected_pay_date);

-- ---------------------------------------------------------------------
-- 2. driver_settlements — what the carrier owes a 1099 driver for a period.
--    net_owed_cents is a GENERATED column so the ledger identity
--    (net = gross + accessorials - deductions) can never drift.
-- ---------------------------------------------------------------------
create table if not exists public.driver_settlements (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid references auth.users(id) on delete set null,
  company_id uuid references public.companies(id) on delete set null, -- reserved org hook
  -- Soft FK to the closest real "driver" record that exists today
  -- (team_memberships rows with role 'driver'); also store the display name
  -- because the demo's drivers are plain names (teams.lead / claims.driver).
  driver_member_id uuid references public.team_memberships(id) on delete set null,
  driver_name text not null,
  period_start date,
  period_end date,
  gross_cents bigint not null default 0 check (gross_cents >= 0),
  deductions_cents bigint not null default 0 check (deductions_cents >= 0),
  accessorials_cents bigint not null default 0 check (accessorials_cents >= 0),
  net_owed_cents bigint generated always as
    (gross_cents + accessorials_cents - deductions_cents) stored,
  status text not null default 'draft'
    check (status in ('draft','finalized','paid')),
  expected_pay_date date,
  advance_id uuid,                                -- RESERVED, see receivables note
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
comment on column public.driver_settlements.advance_id is
  'RESERVED for the future payments/advances layer (early driver pay). Nullable; no FK yet.';
-- ADD-A-STATE: same pattern as receivables (drop + recreate the status check).
create index if not exists driver_settlements_owner_idx on public.driver_settlements (owner_id);
create index if not exists driver_settlements_driver_idx on public.driver_settlements (driver_member_id);
create index if not exists driver_settlements_status_idx on public.driver_settlements (status);

-- ---------------------------------------------------------------------
-- 3. settlement_lines — per-stop detail behind a driver settlement.
--    owner_id is denormalized from the parent so RLS can scope without a join.
-- ---------------------------------------------------------------------
create table if not exists public.settlement_lines (
  id uuid primary key default gen_random_uuid(),
  settlement_id uuid not null references public.driver_settlements(id) on delete cascade,
  owner_id uuid references auth.users(id) on delete set null,
  stop_ref text,                                  -- nullable: no stops table yet
  delivery_ref text,                              -- nullable: no deliveries table yet
  line_type text not null
    check (line_type in ('stop_pay','accessorial','deduction')),
  amount_cents bigint not null default 0,         -- signed allowed (deductions can be modeled +/-)
  note text,
  created_at timestamptz not null default now()
);
create index if not exists settlement_lines_settlement_idx on public.settlement_lines (settlement_id);
create index if not exists settlement_lines_owner_idx on public.settlement_lines (owner_id);

-- ---------------------------------------------------------------------
-- 4. financial_events — APPEND-ONLY ledger of financial state changes.
--    This is the audit spine the future fintech layer reads from. No updates,
--    no deletes: enforced by (a) omitting UPDATE/DELETE RLS policies and
--    (b) a hard trigger below.
-- ---------------------------------------------------------------------
create table if not exists public.financial_events (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid references auth.users(id) on delete set null,
  company_id uuid references public.companies(id) on delete set null, -- reserved org hook
  entity_type text not null,                      -- 'receivable' | 'driver_settlement' | ...
  entity_id uuid not null,
  event_type text not null,                       -- 'receivable.verified', 'settlement.finalized', ...
  amount_cents bigint,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);
create index if not exists financial_events_owner_idx on public.financial_events (owner_id);
create index if not exists financial_events_entity_idx on public.financial_events (entity_type, entity_id);
create index if not exists financial_events_type_idx on public.financial_events (event_type);

create or replace function public.financial_events_block_mutations()
returns trigger
language plpgsql
as $$
begin
  raise exception 'financial_events is append-only: % is not permitted', tg_op;
end;
$$;
drop trigger if exists financial_events_no_update on public.financial_events;
create trigger financial_events_no_update
  before update or delete on public.financial_events
  for each row execute function public.financial_events_block_mutations();
drop trigger if exists financial_events_no_truncate on public.financial_events;
create trigger financial_events_no_truncate
  before truncate on public.financial_events
  for each statement execute function public.financial_events_block_mutations();

-- =====================================================================
-- RLS — match the live owner_id = auth.uid() pattern (tolerating null owner
-- for demo/pre-auth rows), exactly like claims / app_state.
-- =====================================================================
alter table public.financing_config enable row level security;
alter table public.receivables enable row level security;
alter table public.driver_settlements enable row level security;
alter table public.settlement_lines enable row level security;
alter table public.financial_events enable row level security;

-- financing_config: readable by anyone authenticated (the global default must
-- be visible); writable only on your own row.
drop policy if exists "financing_config_select" on public.financing_config;
create policy "financing_config_select" on public.financing_config
  for select to authenticated
  using (owner_id = auth.uid() or owner_id is null);
drop policy if exists "financing_config_insert" on public.financing_config;
create policy "financing_config_insert" on public.financing_config
  for insert to authenticated with check (owner_id = auth.uid());
drop policy if exists "financing_config_update" on public.financing_config;
create policy "financing_config_update" on public.financing_config
  for update to authenticated
  using (owner_id = auth.uid()) with check (owner_id = auth.uid());

-- receivables
drop policy if exists "receivables_select_own" on public.receivables;
create policy "receivables_select_own" on public.receivables
  for select to authenticated using (owner_id = auth.uid() or owner_id is null);
drop policy if exists "receivables_insert_own" on public.receivables;
create policy "receivables_insert_own" on public.receivables
  for insert to authenticated with check (owner_id = auth.uid());
drop policy if exists "receivables_update_own" on public.receivables;
create policy "receivables_update_own" on public.receivables
  for update to authenticated
  using (owner_id = auth.uid() or owner_id is null) with check (owner_id = auth.uid());
drop policy if exists "receivables_delete_own" on public.receivables;
create policy "receivables_delete_own" on public.receivables
  for delete to authenticated using (owner_id = auth.uid());

-- driver_settlements
drop policy if exists "driver_settlements_select_own" on public.driver_settlements;
create policy "driver_settlements_select_own" on public.driver_settlements
  for select to authenticated using (owner_id = auth.uid() or owner_id is null);
drop policy if exists "driver_settlements_insert_own" on public.driver_settlements;
create policy "driver_settlements_insert_own" on public.driver_settlements
  for insert to authenticated with check (owner_id = auth.uid());
drop policy if exists "driver_settlements_update_own" on public.driver_settlements;
create policy "driver_settlements_update_own" on public.driver_settlements
  for update to authenticated
  using (owner_id = auth.uid() or owner_id is null) with check (owner_id = auth.uid());
drop policy if exists "driver_settlements_delete_own" on public.driver_settlements;
create policy "driver_settlements_delete_own" on public.driver_settlements
  for delete to authenticated using (owner_id = auth.uid());

-- settlement_lines (scoped by denormalized owner_id)
drop policy if exists "settlement_lines_select_own" on public.settlement_lines;
create policy "settlement_lines_select_own" on public.settlement_lines
  for select to authenticated using (owner_id = auth.uid() or owner_id is null);
-- A line must be owned by the caller AND belong to a settlement the caller owns
-- (the FK alone only checks existence, not ownership).
drop policy if exists "settlement_lines_insert_own" on public.settlement_lines;
create policy "settlement_lines_insert_own" on public.settlement_lines
  for insert to authenticated with check (
    owner_id = auth.uid()
    and exists (select 1 from public.driver_settlements s where s.id = settlement_id and s.owner_id = auth.uid())
  );
drop policy if exists "settlement_lines_update_own" on public.settlement_lines;
create policy "settlement_lines_update_own" on public.settlement_lines
  for update to authenticated
  using (owner_id = auth.uid() or owner_id is null)
  with check (
    owner_id = auth.uid()
    and exists (select 1 from public.driver_settlements s where s.id = settlement_id and s.owner_id = auth.uid())
  );
drop policy if exists "settlement_lines_delete_own" on public.settlement_lines;
create policy "settlement_lines_delete_own" on public.settlement_lines
  for delete to authenticated using (owner_id = auth.uid());

-- financial_events: SELECT + INSERT only (append-only). No update/delete policy.
drop policy if exists "financial_events_select_own" on public.financial_events;
create policy "financial_events_select_own" on public.financial_events
  for select to authenticated using (owner_id = auth.uid() or owner_id is null);
drop policy if exists "financial_events_insert_own" on public.financial_events;
create policy "financial_events_insert_own" on public.financial_events
  for insert to authenticated with check (owner_id = auth.uid());  -- strict: no null-owner pollution of a shared audit ledger

-- ---------------------------------------------------------------------
-- DEV ANON policies — mirror the "Temporary Development Policies" in
-- docs/supabase-backend-setup.md. The app historically connects as `anon`
-- (local demo login). These let the Cash Position demo read the null-owner
-- seed rows below before real Supabase Auth is wired in. REMOVE/replace with
-- owner-scoped authenticated policies once auth is live.
-- ---------------------------------------------------------------------
drop policy if exists "Dev anon read financing_config" on public.financing_config;
create policy "Dev anon read financing_config" on public.financing_config for select to anon using (true);
-- Cash Position is READ-ONLY in the app, so anon gets SELECT only (enough to
-- render the null-owner seed). No anon write policies — nothing in the feature
-- inserts/updates these tables.
drop policy if exists "Dev anon read receivables" on public.receivables;
create policy "Dev anon read receivables" on public.receivables for select to anon using (true);
drop policy if exists "Dev anon read driver_settlements" on public.driver_settlements;
create policy "Dev anon read driver_settlements" on public.driver_settlements for select to anon using (true);
drop policy if exists "Dev anon read settlement_lines" on public.settlement_lines;
create policy "Dev anon read settlement_lines" on public.settlement_lines for select to anon using (true);
drop policy if exists "Dev anon read financial_events" on public.financial_events;
create policy "Dev anon read financial_events" on public.financial_events for select to anon using (true);
-- Clean up any anon write policies created by an earlier draft of this file.
drop policy if exists "Dev anon write receivables" on public.receivables;
drop policy if exists "Dev anon update receivables" on public.receivables;
drop policy if exists "Dev anon append financial_events" on public.financial_events;

-- Grants (automatic table exposure was disabled at project setup).
grant usage on schema public to anon, authenticated;
grant select, insert, update, delete on public.receivables to authenticated;
grant select, insert, update, delete on public.driver_settlements to authenticated;
grant select, insert, update, delete on public.settlement_lines to authenticated;
grant select, insert on public.financial_events to authenticated;        -- no update/delete: append-only
grant select, insert, update on public.financing_config to authenticated;
grant select on public.receivables to anon;                              -- dev, read-only
grant select on public.driver_settlements to anon;                       -- dev, read-only
grant select on public.settlement_lines to anon;                         -- dev, read-only
grant select on public.financial_events to anon;                         -- dev, read-only
grant select on public.financing_config to anon;                         -- dev, read-only

-- =====================================================================
-- VIEW + RPCs — the cash-position "brain". All SECURITY INVOKER, so RLS
-- scopes results to the caller automatically. The aging bucketing and the
-- early-pay math here are mirrored 1:1 in src/lib/cashPosition.js so the
-- offline demo computes identical numbers.
-- =====================================================================

-- Per-receivable aging classification (drill-down / debugging).
-- "owed" = unpaid and collectible (excludes paid + disputed). days_to_due is
-- relative to current_date; the bucket clamps overdue (<=15, incl. negative)
-- into 0-15 and everything beyond 45 into 45_plus, matching the JS calc.
create or replace view public.cash_position_receivables_aging as
select
  r.*,
  (r.expected_pay_date - current_date) as days_to_due,
  case
    when r.paid_at is not null or r.status in ('paid','disputed') then 'not_owed'
    when (r.expected_pay_date is null) or (r.expected_pay_date - current_date) <= 15 then '0_15'
    when (r.expected_pay_date - current_date) <= 30 then '16_30'
    when (r.expected_pay_date - current_date) <= 45 then '31_45'
    else '45_plus'
  end as aging_bucket,
  (r.paid_at is null and r.status in ('pending','completed','verified','invoiced')) as is_owed
from public.receivables r;

grant select on public.cash_position_receivables_aging to anon, authenticated;

-- Aggregated cash-position summary for the calling carrier (one row).
-- Money split:
--   verified group  = status in ('verified','invoiced')   (confirmed/billed)
--   pending group   = status in ('pending','completed')   (not yet verified)
--   total_owed      = verified + pending (collectible, unpaid)
--   disputed/paid   = reported separately (not part of the owed split)
-- Aging buckets cover the collectible set only, so the four buckets sum to
-- total_owed_cents.
create or replace function public.get_cash_position_summary()
returns table (
  total_owed_cents bigint,
  verified_cents bigint,
  pending_cents bigint,
  disputed_cents bigint,
  paid_cents bigint,
  bucket_0_15_cents bigint,
  bucket_16_30_cents bigint,
  bucket_31_45_cents bigint,
  bucket_45_plus_cents bigint,
  receivable_count integer,
  driver_net_owed_cents bigint,
  driver_settlement_count integer
)
language sql
stable
security invoker
set search_path = public
as $$
  with owed as (
    select * from public.receivables
    where paid_at is null and status in ('pending','completed','verified','invoiced')
  )
  select
    coalesce(sum(o.amount_cents), 0)::bigint as total_owed_cents,
    coalesce(sum(o.amount_cents) filter (where o.status in ('verified','invoiced')), 0)::bigint as verified_cents,
    coalesce(sum(o.amount_cents) filter (where o.status in ('pending','completed')), 0)::bigint as pending_cents,
    coalesce((select sum(amount_cents) from public.receivables where status = 'disputed' and paid_at is null), 0)::bigint as disputed_cents,
    coalesce((select sum(amount_cents) from public.receivables where status = 'paid' or paid_at is not null), 0)::bigint as paid_cents,
    coalesce(sum(o.amount_cents) filter (where o.expected_pay_date is null or (o.expected_pay_date - current_date) <= 15), 0)::bigint as bucket_0_15_cents,
    coalesce(sum(o.amount_cents) filter (where (o.expected_pay_date - current_date) between 16 and 30), 0)::bigint as bucket_16_30_cents,
    coalesce(sum(o.amount_cents) filter (where (o.expected_pay_date - current_date) between 31 and 45), 0)::bigint as bucket_31_45_cents,
    coalesce(sum(o.amount_cents) filter (where (o.expected_pay_date - current_date) > 45), 0)::bigint as bucket_45_plus_cents,
    count(o.*)::integer as receivable_count,
    coalesce((select sum(net_owed_cents) from public.driver_settlements where status in ('draft','finalized')), 0)::bigint as driver_net_owed_cents,
    coalesce((select count(*) from public.driver_settlements where status in ('draft','finalized')), 0)::integer as driver_settlement_count
  from owed o;
$$;

grant execute on function public.get_cash_position_summary() to anon, authenticated;

-- Early-pay eligibility — PREVIEW ONLY. Creates nothing, moves nothing, makes
-- no external call. Eligible = unpaid receivables in (completed, verified,
-- invoiced). Rates come from financing_config (caller's row, else the global
-- default, else 0.85 / 0.02). advanceable = round(advance_rate * eligible);
-- preview_fee = round(fee_rate * advanceable).
create or replace function public.get_early_pay_preview()
returns table (
  eligible_amount_cents bigint,
  eligible_count integer,
  advance_rate numeric,
  fee_rate numeric,
  advanceable_cents bigint,
  preview_fee_cents bigint,
  net_funding_cents bigint
)
language sql
stable
security invoker
set search_path = public
as $$
  -- Deterministic precedence: caller's own row (0) > global default (1) >
  -- hardcoded fallback (2). UNION ALL has no inherent ordering, so we rank
  -- explicitly and ORDER BY — mirrors pickRates (own || global || default) in
  -- src/lib/cashPositionRepository.js.
  with ranked as (
    select advance_rate, fee_rate, 0 as prio
    from public.financing_config where owner_id = auth.uid()
    union all
    select advance_rate, fee_rate, 1 as prio
    from public.financing_config where owner_id is null
    union all
    select 0.85::numeric, 0.02::numeric, 2 as prio
  ),
  picked as (select advance_rate, fee_rate from ranked order by prio limit 1),
  eligible as (
    select coalesce(sum(amount_cents), 0)::bigint as amt, count(*)::integer as cnt
    from public.receivables
    where paid_at is null and status in ('completed','verified','invoiced')
  )
  select
    e.amt as eligible_amount_cents,
    e.cnt as eligible_count,
    p.advance_rate,
    p.fee_rate,
    round(p.advance_rate * e.amt)::bigint as advanceable_cents,
    round(p.fee_rate * round(p.advance_rate * e.amt))::bigint as preview_fee_cents,
    (round(p.advance_rate * e.amt) - round(p.fee_rate * round(p.advance_rate * e.amt)))::bigint as net_funding_cents
  from eligible e cross join picked p;
$$;

grant execute on function public.get_early_pay_preview() to anon, authenticated;

-- =====================================================================
-- SEED — a small, realistic set for local dev. owner_id is null so the demo
-- (anon) can read it via the dev policies above. Amounts are bigint cents.
-- expected_pay_date is relative to current_date so aging buckets stay stable.
-- Idempotent via fixed UUIDs + on conflict do nothing.
-- Named fixtures match the app's demo (Lowe's, Home Depot, Best Buy, RC
-- Willey; drivers Marcus J., Mike S., Tony R., Chris M.). NOTE: RXO is not used
-- anywhere in this repo, so it is intentionally not seeded.
-- =====================================================================
insert into public.receivables
  (id, owner_id, payer_name, source_contract_ref, source_route, amount_cents, status, expected_pay_date, paid_at)
values
  ('a0000000-0000-4000-8000-000000000101', null, 'Lowe''s',     'LOWES-APPL', 'Syracuse Appliance', 482000, 'verified',  current_date + 8,  null),
  ('a0000000-0000-4000-8000-000000000102', null, 'Lowe''s',     'LOWES-APPL', 'Syracuse Appliance', 315000, 'invoiced',  current_date + 22, null),
  ('a0000000-0000-4000-8000-000000000103', null, 'Home Depot',  'HD-LARGE',   'Furniture Route',    294000, 'completed', current_date + 12, null),
  ('a0000000-0000-4000-8000-000000000104', null, 'Home Depot',  'HD-LARGE',   'Furniture Route',    560000, 'pending',   current_date + 38, null),
  ('a0000000-0000-4000-8000-000000000105', null, 'Best Buy',    'BBY-TECH',   'Tech Route',         187500, 'verified',  current_date + 27, null),
  ('a0000000-0000-4000-8000-000000000106', null, 'RC Willey',   'RCW-FURN',   'Furniture Route',    624000, 'completed', current_date + 52, null),
  ('a0000000-0000-4000-8000-000000000107', null, 'Best Buy',    'BBY-TECH',   'Tech Route',          98050, 'invoiced',  current_date + 5,  null),
  ('a0000000-0000-4000-8000-000000000108', null, 'Lowe''s',     'LOWES-APPL', 'Syracuse Appliance', 145000, 'disputed',  current_date + 18, null),
  ('a0000000-0000-4000-8000-000000000109', null, 'Home Depot',  'HD-LARGE',   'Furniture Route',    330000, 'paid',      current_date - 6,  now() - interval '6 days')
on conflict (id) do nothing;

insert into public.driver_settlements
  (id, owner_id, driver_name, period_start, period_end, gross_cents, deductions_cents, accessorials_cents, status, expected_pay_date)
values
  ('b0000000-0000-4000-8000-000000000201', null, 'Marcus J.', current_date - 7, current_date - 1, 184000, 12000, 9000,  'finalized', current_date + 3),
  ('b0000000-0000-4000-8000-000000000202', null, 'Mike S.',   current_date - 7, current_date - 1, 162000, 20000, 0,     'draft',     current_date + 3),
  ('b0000000-0000-4000-8000-000000000203', null, 'Tony R.',   current_date - 14, current_date - 8, 150000, 5000, 7500,  'paid',      current_date - 4),
  ('b0000000-0000-4000-8000-000000000204', null, 'Chris M.',  current_date - 7, current_date - 1, 191000, 0,    13000, 'finalized', current_date + 3)
on conflict (id) do nothing;

insert into public.settlement_lines
  (id, settlement_id, owner_id, stop_ref, line_type, amount_cents, note)
values
  ('c0000000-0000-4000-8000-000000000301', 'b0000000-0000-4000-8000-000000000201', null, 'route-0607', 'stop_pay',    184000, '23 stops · Syracuse Appliance'),
  ('c0000000-0000-4000-8000-000000000302', 'b0000000-0000-4000-8000-000000000201', null, null,         'accessorial',   9000, '2 heavy-item assists'),
  ('c0000000-0000-4000-8000-000000000303', 'b0000000-0000-4000-8000-000000000201', null, null,         'deduction',    12000, 'Fuel card + uniform'),
  ('c0000000-0000-4000-8000-000000000304', 'b0000000-0000-4000-8000-000000000202', null, 'route-0607', 'stop_pay',    162000, '20 stops · Furniture Route'),
  ('c0000000-0000-4000-8000-000000000305', 'b0000000-0000-4000-8000-000000000202', null, null,         'deduction',    20000, 'Damage chargeback (CLM-1009)')
on conflict (id) do nothing;

insert into public.financial_events
  (id, owner_id, entity_type, entity_id, event_type, amount_cents, metadata)
values
  ('d0000000-0000-4000-8000-000000000401', null, 'receivable',        'a0000000-0000-4000-8000-000000000101', 'receivable.verified',  482000, '{"payer":"Lowe''s"}'::jsonb),
  ('d0000000-0000-4000-8000-000000000402', null, 'receivable',        'a0000000-0000-4000-8000-000000000102', 'receivable.invoiced',  315000, '{"payer":"Lowe''s"}'::jsonb),
  ('d0000000-0000-4000-8000-000000000403', null, 'receivable',        'a0000000-0000-4000-8000-000000000109', 'receivable.paid',      330000, '{"payer":"Home Depot"}'::jsonb),
  ('d0000000-0000-4000-8000-000000000404', null, 'driver_settlement', 'b0000000-0000-4000-8000-000000000201', 'settlement.finalized', 181000, '{"driver":"Marcus J."}'::jsonb)
on conflict (id) do nothing;

notify pgrst, 'reload schema';

-- =====================================================================
-- ROLLBACK (reversible). Run this block to fully remove the Cash Position
-- slice. It touches ONLY the objects created above; existing settlement/
-- delivery/claims tables are untouched.
-- =====================================================================
-- drop function if exists public.get_early_pay_preview();
-- drop function if exists public.get_cash_position_summary();
-- drop view if exists public.cash_position_receivables_aging;
-- drop trigger if exists financial_events_no_update on public.financial_events;
-- drop trigger if exists financial_events_no_truncate on public.financial_events;
-- drop function if exists public.financial_events_block_mutations();
-- drop table if exists public.financial_events;
-- drop table if exists public.settlement_lines;
-- drop table if exists public.driver_settlements;
-- drop table if exists public.receivables;
-- drop table if exists public.financing_config;
-- notify pgrst, 'reload schema';
