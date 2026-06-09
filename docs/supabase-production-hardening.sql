-- ============================================================================
-- PRODUCTION HARDENING — APPLIED 2026-06-09 to the live database.
--
-- A browser-driven audit (see supabase-security-audit.sql) found that the
-- core tables had leftover dev policies granting the PUBLIC anon key — and any
-- authenticated user — full access to all rows. This script is the exact
-- remediation that was run. Idempotent (drop ... if exists), safe to re-run.
--
-- Verified safe before running: app_state and claims already have owner-scoped
-- policies ("Users can ... own ...") whose with_check is (owner_id = auth.uid()),
-- so logged-in CRUD is unaffected. The app sets owner_id on every write.
--
-- Post-fix verification query returned ZERO rows (no anon policies, no
-- unconditional `true` policies on these tables remain).
-- ============================================================================

-- ── CRITICAL: public, no-login access to all app data via the anon key ──
drop policy if exists "Dev anon can read app state"   on public.app_state;
drop policy if exists "Dev anon can insert app state" on public.app_state;
drop policy if exists "Dev anon can update app state" on public.app_state;
drop policy if exists "Dev anon can read claims"   on public.claims;
drop policy if exists "Dev anon can insert claims" on public.claims;
drop policy if exists "Dev anon can update claims" on public.claims;
drop policy if exists "Dev anon can delete claims" on public.claims;

-- ── HIGH: cross-tenant leak — any authenticated user could touch ALL claims ──
-- (These used `using true`; the owner-scoped "Users can ... own claims"
--  policies remain and correctly restrict to owner_id = auth.uid().)
drop policy if exists "Allow authenticated users to read claims"   on public.claims;
drop policy if exists "Allow authenticated users to insert claims" on public.claims;
drop policy if exists "Allow authenticated users to update claims" on public.claims;
drop policy if exists "Allow authenticated users to delete claims" on public.claims;

-- ── Remaining policies after this (the correct, owner-scoped set) ──
--   app_state:  Users can read/insert/update own app state
--               (owner_id = auth.uid() OR owner_id IS NULL for shared demo rows;
--                with_check owner_id = auth.uid())
--   claims:     Users can read/insert/update/delete own claims
--               (same owner scoping)
--
-- NOTE: the financial tables (receivables, driver_settlements, settlement_lines,
-- financing_config, financial_events) were checked too and had NO anon policies
-- live — the "Dev anon read" lines in docs/supabase-cash-position.sql were never
-- applied (or already removed). If you ever re-run that file, delete its
-- "Dev anon read ..." block first.
