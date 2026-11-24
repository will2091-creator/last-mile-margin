-- Run as an analyst with administrative read access. One completion per browser tab/tool.
-- Attribute each new customer to their first chosen, completed tool session before trial.
-- Existing subscribers, untouched examples and zero-dollar invoices cannot count as new payers.
with attribution as (
  select distinct on (v.owner_id) v.id, b.trial_started,b.trial_end,b.first_payment
  from public.tool_visits v join public.tool_billing_milestones b on b.owner_id=v.owner_id
  where v.completed_at is not null and v.chosen_at <= b.trial_started
  order by v.owner_id,v.chosen_at,v.id
), cohorts as (
  select v.*,a.trial_started,a.first_payment,
    case when greatest(v.completed_at+interval '3 days',a.trial_end)<=now() then 'mature' else 'newer' end as maturity,
    exists(select 1 from public.saved_tool_items i where i.visit_id=v.id and not i.example) as saved
  from public.tool_visits v left join attribution a using(id) where v.completed_at is not null
)
select date_trunc('week',completed_at at time zone 'UTC')::date as cohort_week_utc,source,maturity,
  count(*) as completed_sessions,count(chosen_at) as chose_save,count(trial_started) as activated_trials,
  count(*) filter(where saved) as first_saves,count(*) filter(where first_payment>=trial_started) as paying_customers,
  round(100.0*count(*) filter(where first_payment>=trial_started)/count(*),2) as paying_per_100_sessions
from cohorts group by 1,2,3 order by 1 desc,2,3;
