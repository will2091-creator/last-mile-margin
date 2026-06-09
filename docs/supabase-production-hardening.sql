-- ============================================================================
-- PRODUCTION HARDENING — run in Supabase → SQL Editor AFTER reviewing the
-- output of supabase-security-audit.sql. Idempotent (safe to run more than
-- once). This closes the known holes:
--   A) Removes the "Dev anon read" policies that exposed financial data to the
--      public anon key.
--   B) Enables RLS + owner-scoped policies on the core tables (app_state,
--      claims, documents) in case they were never locked down.
-- All three core tables key on `owner_id` (confirmed from the app's
-- repositories). Authenticated users can only touch their own rows.
-- ============================================================================

-- ───────────────────────────────────────────────────────────────────────────
-- A) DROP the dev-only anonymous read policies (financial data leak).
-- ───────────────────────────────────────────────────────────────────────────
drop policy if exists "Dev anon read financing_config"   on public.financing_config;
drop policy if exists "Dev anon read receivables"        on public.receivables;
drop policy if exists "Dev anon read driver_settlements" on public.driver_settlements;
drop policy if exists "Dev anon read settlement_lines"   on public.settlement_lines;
drop policy if exists "Dev anon read financial_events"   on public.financial_events;
-- Defensive: drop any anon write policies an older draft may have created.
drop policy if exists "Dev anon write receivables"       on public.receivables;
drop policy if exists "Dev anon update receivables"      on public.receivables;
drop policy if exists "Dev anon append financial_events" on public.financial_events;

-- The anon role should not retain table-level grants on business data.
-- (Authenticated grants stay; see supabase-cash-position.sql.)
revoke select, insert, update, delete on public.receivables        from anon;
revoke select, insert, update, delete on public.driver_settlements from anon;
revoke select, insert, update, delete on public.settlement_lines   from anon;
revoke select, insert, update, delete on public.financing_config   from anon;
revoke select, insert, update, delete on public.financial_events   from anon;

-- ───────────────────────────────────────────────────────────────────────────
-- B) Lock down the core business tables (owner-scoped).
-- ───────────────────────────────────────────────────────────────────────────

-- app_state — the main per-user data blob (keyed by owner_id).
alter table public.app_state enable row level security;
drop policy if exists "app_state_select_own" on public.app_state;
drop policy if exists "app_state_insert_own" on public.app_state;
drop policy if exists "app_state_update_own" on public.app_state;
drop policy if exists "app_state_delete_own" on public.app_state;
create policy "app_state_select_own" on public.app_state
  for select to authenticated using (auth.uid() = owner_id);
create policy "app_state_insert_own" on public.app_state
  for insert to authenticated with check (auth.uid() = owner_id);
create policy "app_state_update_own" on public.app_state
  for update to authenticated using (auth.uid() = owner_id) with check (auth.uid() = owner_id);
create policy "app_state_delete_own" on public.app_state
  for delete to authenticated using (auth.uid() = owner_id);

-- claims — owner-scoped. The app also reads shared demo rows where owner_id IS
-- NULL, so SELECT allows own rows OR null-owner rows; writes are own-only.
alter table public.claims enable row level security;
drop policy if exists "claims_select_own_or_demo" on public.claims;
drop policy if exists "claims_insert_own" on public.claims;
drop policy if exists "claims_update_own" on public.claims;
drop policy if exists "claims_delete_own" on public.claims;
create policy "claims_select_own_or_demo" on public.claims
  for select to authenticated using (auth.uid() = owner_id or owner_id is null);
create policy "claims_insert_own" on public.claims
  for insert to authenticated with check (auth.uid() = owner_id);
create policy "claims_update_own" on public.claims
  for update to authenticated using (auth.uid() = owner_id) with check (auth.uid() = owner_id);
create policy "claims_delete_own" on public.claims
  for delete to authenticated using (auth.uid() = owner_id);

-- documents — owner-scoped (metadata rows; files live in Storage with their own
-- bucket policies, see team-photo-retention-setup.sql for the pattern).
alter table public.documents enable row level security;
drop policy if exists "documents_select_own" on public.documents;
drop policy if exists "documents_insert_own" on public.documents;
drop policy if exists "documents_update_own" on public.documents;
drop policy if exists "documents_delete_own" on public.documents;
create policy "documents_select_own" on public.documents
  for select to authenticated using (auth.uid() = owner_id);
create policy "documents_insert_own" on public.documents
  for insert to authenticated with check (auth.uid() = owner_id);
create policy "documents_update_own" on public.documents
  for update to authenticated using (auth.uid() = owner_id) with check (auth.uid() = owner_id);
create policy "documents_delete_own" on public.documents
  for delete to authenticated using (auth.uid() = owner_id);

-- ───────────────────────────────────────────────────────────────────────────
-- Re-run supabase-security-audit.sql after this. Query #1 should list every
-- table with rls_enabled = true, and query #2 should show no anon policies
-- other than the intentional waitlist INSERT.
-- ───────────────────────────────────────────────────────────────────────────
