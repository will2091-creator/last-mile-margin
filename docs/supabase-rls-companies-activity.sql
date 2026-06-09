-- Adds the missing RLS policies for `companies` and `activity_log`.
-- Both tables had RLS ENABLED but ZERO policies, so under RLS every query
-- against them silently returned nothing (and inserts were blocked). This
-- scopes them to the caller's company. Idempotent — safe to re-run.
--
-- Run in: Supabase Dashboard → SQL Editor → New query.
-- Depends on: public.profiles(id = auth.users.id, company_id) from
--   docs/supabase-backend-setup.md (already live).

-- ── companies ──────────────────────────────────────────────────────────────
-- Members can read the company their profile belongs to.
drop policy if exists "members read own company" on public.companies;
create policy "members read own company"
  on public.companies for select to authenticated
  using (
    id in (select company_id from public.profiles where id = auth.uid())
  );

-- Owners/admins can rename their own company.
drop policy if exists "owners update own company" on public.companies;
create policy "owners update own company"
  on public.companies for update to authenticated
  using (
    id in (
      select company_id from public.profiles
      where id = auth.uid() and role in ('owner', 'admin')
    )
  )
  with check (
    id in (
      select company_id from public.profiles
      where id = auth.uid() and role in ('owner', 'admin')
    )
  );

-- ── activity_log ─────────────────────────────────────────────────────────────
-- Members can read their company's activity.
drop policy if exists "members read company activity" on public.activity_log;
create policy "members read company activity"
  on public.activity_log for select to authenticated
  using (
    company_id in (select company_id from public.profiles where id = auth.uid())
  );

-- Members can append activity for their own company.
drop policy if exists "members write company activity" on public.activity_log;
create policy "members write company activity"
  on public.activity_log for insert to authenticated
  with check (
    company_id in (select company_id from public.profiles where id = auth.uid())
  );
