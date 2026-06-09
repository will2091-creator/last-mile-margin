-- Run this in Supabase SQL Editor (Dashboard → SQL Editor → New query)
-- Creates the waitlist table so visitors can drop their email to be notified at launch.

create table if not exists public.waitlist (
  id         uuid primary key default gen_random_uuid(),
  email      text not null,
  created_at timestamptz not null default now(),
  constraint waitlist_email_key unique (email)
);

-- Index for fast lookups / exports
create index if not exists waitlist_email_idx on public.waitlist(email);

-- RLS: allow anyone (including anonymous visitors) to INSERT their own email.
-- Only service role (your dashboard / admin) can SELECT or DELETE rows.
alter table public.waitlist enable row level security;

create policy "Anyone can join the waitlist"
  on public.waitlist for insert
  with check (true);
