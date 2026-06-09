-- Run this in Supabase SQL Editor (Dashboard → SQL Editor → New query)
-- Creates the subscriptions table + RLS so users can only read their own row.

create table if not exists public.subscriptions (
  id                       uuid primary key default gen_random_uuid(),
  user_id                  uuid not null references auth.users(id) on delete cascade,
  stripe_customer_id       text,
  stripe_subscription_id   text,
  status                   text not null default 'incomplete',
  -- status values: trialing | active | past_due | unpaid | canceled | incomplete | incomplete_expired
  trial_end                timestamptz,
  current_period_end       timestamptz,
  cancel_at_period_end     boolean not null default false,
  updated_at               timestamptz not null default now(),
  constraint subscriptions_user_id_key unique (user_id)
);

-- Index for fast lookups
create index if not exists subscriptions_user_id_idx on public.subscriptions(user_id);

-- Table-level privilege: REQUIRED in addition to RLS. Without this GRANT the
-- client gets "permission denied for table subscriptions" (42501) even with a
-- correct RLS policy. The logged-in client reads as the `authenticated` role.
grant usage on schema public to authenticated;
grant select on public.subscriptions to authenticated;

-- RLS: users can read only their own row; Edge Functions use service role (bypasses RLS)
alter table public.subscriptions enable row level security;

drop policy if exists "Users can read their own subscription" on public.subscriptions;
create policy "Users can read their own subscription"
  on public.subscriptions for select to authenticated
  using (auth.uid() = user_id);

-- Make the new table visible to the REST API immediately.
notify pgrst, 'reload schema';
