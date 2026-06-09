-- ============================================================================
-- SECURITY AUDIT (READ-ONLY) — run in Supabase → SQL Editor → New query.
-- Nothing here changes data or policies. It tells you the live truth about
-- which tables are exposed. Review the output, then run
-- supabase-production-hardening.sql to close any holes.
-- ============================================================================

-- 1) Which public tables have RLS turned OFF? (OFF = anyone with the public
--    anon key can read/write every row. This list should be EMPTY.)
select n.nspname as schema, c.relname as table, c.relrowsecurity as rls_enabled
from pg_class c
join pg_namespace n on n.oid = c.relnamespace
where n.nspname = 'public' and c.relkind = 'r'
order by c.relrowsecurity asc, c.relname;

-- 2) Any policy that grants the ANON (public, not-logged-in) role access?
--    These are the dangerous ones. This list should ideally be EMPTY in prod
--    (the only acceptable anon policies are intentional public reads, e.g. the
--    waitlist INSERT). Anything that lets anon SELECT business data is a leak.
select schemaname as schema,
       tablename  as table,
       policyname as policy,
       cmd        as command,
       roles,
       qual       as using_expr,
       with_check
from pg_policies
where schemaname = 'public'
  and ('anon' = any (roles) or roles = '{public}')
order by tablename, policyname;

-- 3) Full policy inventory for the tables the app uses — eyeball that each
--    one scopes rows to the owner (auth.uid() = owner_id / user_id), not `true`.
select tablename as table, policyname as policy, cmd as command, roles, qual as using_expr
from pg_policies
where schemaname = 'public'
  and tablename in (
    'app_state','claims','documents','profiles','team_memberships',
    'route_checkins','team_photos','receivables','driver_settlements',
    'settlement_lines','financing_config','financial_events',
    'subscriptions','waitlist'
  )
order by tablename, cmd;

-- 4) Tables the frontend reads/writes but that may have NO policies at all.
--    If a table has RLS enabled but ZERO policies, it is locked to everyone
--    (safe but broken); if RLS is OFF it is wide open (unsafe). Cross-check
--    against query #1.
select c.relname as table,
       c.relrowsecurity as rls_enabled,
       count(p.policyname) as policy_count
from pg_class c
join pg_namespace n on n.oid = c.relnamespace
left join pg_policies p on p.schemaname = n.nspname and p.tablename = c.relname
where n.nspname = 'public' and c.relkind = 'r'
group by c.relname, c.relrowsecurity
order by policy_count asc, c.relname;
