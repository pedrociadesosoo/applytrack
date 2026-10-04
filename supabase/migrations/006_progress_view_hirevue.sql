-- 006: count a HireVue invite as hearing back from the company. It's a
-- one-way recorded screen, so it doesn't count toward interview conversion.
create or replace view application_progress
with (security_invoker = true) as
select
  a.id as application_id,
  a.current_stage,
  a.next_action_date,
  coalesce(bool_or(e.stage in ('oa','hirevue','phone_screen','behavioral','technical_interview','onsite','offer','rejected')), false) as got_response,
  coalesce(bool_or(e.stage in ('phone_screen','behavioral','technical_interview','onsite','offer')), false) as reached_interview,
  coalesce(max(e.event_date), a.created_at) as last_activity_at
from applications a
left join application_events e on e.application_id = a.id
group by a.id;
