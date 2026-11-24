begin;
create type public.free_tool as enum ('route-profit-calculator','contract-rate-checker','driver-pay-calculator','chargeback-dispute-letter');
create table public.tool_visits (
  id uuid primary key, source public.free_tool not null, completed_at timestamptz, chosen_at timestamptz,
  owner_id uuid references auth.users on delete cascade
);
create table public.saved_tool_items (
  id uuid primary key, owner_id uuid not null references auth.users on delete cascade,
  visit_id uuid not null references public.tool_visits, source public.free_tool not null,
  payload jsonb not null, example boolean not null, deadline date, created_at timestamptz not null default now()
);
create index on public.saved_tool_items(owner_id,created_at desc);
create table public.tool_billing_milestones (
  owner_id uuid primary key references auth.users on delete cascade,
  trial_started timestamptz, trial_end timestamptz, first_payment timestamptz
);
alter table public.tool_visits enable row level security;
alter table public.saved_tool_items enable row level security;
alter table public.tool_billing_milestones enable row level security;
revoke all on public.tool_visits,public.saved_tool_items,public.tool_billing_milestones from public,anon,authenticated;
grant select on public.saved_tool_items to authenticated;
grant update(deadline) on public.saved_tool_items to authenticated;
create policy read_own_items on public.saved_tool_items for select to authenticated using (owner_id=auth.uid() and exists(select 1 from public.subscriptions s where s.user_id=auth.uid() and s.status in ('active','trialing')));
create policy change_claim_deadline on public.saved_tool_items for update to authenticated using (owner_id=auth.uid() and source='chargeback-dispute-letter' and exists(select 1 from public.subscriptions s where s.user_id=auth.uid() and s.status in ('active','trialing'))) with check(owner_id=auth.uid());

create function public.record_tool_visit(visit uuid,tool public.free_tool,step text) returns void
language plpgsql security definer set search_path='' as $$
begin
  if step not in ('completed','chosen') or step is null then raise exception 'Unknown step'; end if;
  insert into public.tool_visits as v(id,source,completed_at,chosen_at)
  values(visit,tool,case when step='completed' then now() end,case when step='chosen' then now() end)
  on conflict(id) do update set completed_at=coalesce(v.completed_at,excluded.completed_at),chosen_at=coalesce(v.chosen_at,excluded.chosen_at)
  where v.source=excluded.source;
end $$;

create function public.bind_tool_visit(visit uuid,tool public.free_tool,expected_owner uuid) returns void
language plpgsql security definer set search_path='' as $$
begin
  if auth.uid() is null or auth.uid() is distinct from expected_owner then raise exception 'Account changed'; end if;
  insert into public.tool_visits as v(id,source,owner_id,chosen_at) values(visit,tool,auth.uid(),now())
  on conflict(id) do update set owner_id=auth.uid(), chosen_at=coalesce(v.chosen_at,now())
  where v.source=excluded.source and (v.owner_id is null or v.owner_id=auth.uid());
  if not found then raise exception 'This result belongs to another account'; end if;
end $$;

create function public.save_tool_item(item uuid,visit uuid,tool public.free_tool,expected_owner uuid,content jsonb,is_example boolean)
returns setof public.saved_tool_items language plpgsql security definer set search_path='' as $$
declare saved public.saved_tool_items;
begin
  if not exists(select 1 from public.subscriptions where user_id=auth.uid() and status in ('active','trialing')) then raise exception 'Trial or active subscription required'; end if;
  if jsonb_typeof(content) is distinct from 'object' or jsonb_typeof(content->'metrics') is distinct from 'array'
     or jsonb_typeof(content->'title') is distinct from 'string' or octet_length(content::text)>128000 then raise exception 'Invalid result'; end if;
  perform public.bind_tool_visit(visit,tool,expected_owner);
  insert into public.saved_tool_items(id,visit_id,owner_id,source,payload,example) values(item,visit,auth.uid(),tool,content,is_example) on conflict(id) do nothing;
  select * into strict saved from public.saved_tool_items where id=item and owner_id=auth.uid() and visit_id=visit and source=tool;
  return next saved;
end $$;

create function public.tool_billing_event(account uuid,started timestamptz,ends_at timestamptz,paid timestamptz)
returns void language sql security definer set search_path='' as $$
  insert into public.tool_billing_milestones as m(owner_id,trial_started,trial_end,first_payment) values(account,started,ends_at,paid)
  on conflict(owner_id) do update set trial_started=least(m.trial_started,excluded.trial_started),
  trial_end=case when m.trial_started is null or excluded.trial_started<m.trial_started then excluded.trial_end else m.trial_end end,
  first_payment=least(m.first_payment,excluded.first_payment);
$$;

revoke all on function public.record_tool_visit(uuid,public.free_tool,text),public.bind_tool_visit(uuid,public.free_tool,uuid),public.save_tool_item(uuid,uuid,public.free_tool,uuid,jsonb,boolean),public.tool_billing_event(uuid,timestamptz,timestamptz,timestamptz) from public,anon,authenticated;
grant execute on function public.record_tool_visit(uuid,public.free_tool,text) to anon,authenticated;
grant execute on function public.bind_tool_visit(uuid,public.free_tool,uuid),public.save_tool_item(uuid,uuid,public.free_tool,uuid,jsonb,boolean) to authenticated;
grant execute on function public.tool_billing_event(uuid,timestamptz,timestamptz,timestamptz) to service_role;
notify pgrst,'reload schema';
commit;
