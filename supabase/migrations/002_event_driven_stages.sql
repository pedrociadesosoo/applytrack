-- 002: application_events becomes the source of truth for stage changes,
-- plus a per-application progress view for honest funnel stats.
-- Safe to run on a database that already has schema.sql (001) applied.

-- ---------------------------------------------------------------------------
-- Inserting an event moves the application to that stage.
-- This is how Gmail sync (Phase 3) will write: insert one event with
-- source_email_id, and current_stage follows. Out-of-order events (e.g. a
-- backfill of old emails) never move the stage backwards in time.
-- ---------------------------------------------------------------------------
create or replace function apply_event_stage()
returns trigger as $$
begin
  update applications
     set current_stage = new.stage
   where id = new.application_id
     and current_stage is distinct from new.stage
     and not exists (
       select 1 from application_events e
        where e.application_id = new.application_id
          and e.event_date > new.event_date
     );
  return new;
end;
$$ language plpgsql;

drop trigger if exists trg_application_events_apply_stage on application_events;
create trigger trg_application_events_apply_stage
  after insert on application_events
  for each row execute function apply_event_stage();

-- ---------------------------------------------------------------------------
-- Updating current_stage directly (manual edit / kanban drag) logs an event.
-- pg_trigger_depth() = 1 means "a person/API changed it", not the event
-- trigger above — so one change never produces two events.
-- ---------------------------------------------------------------------------
create or replace function log_stage_change()
returns trigger as $$
begin
  if pg_trigger_depth() = 1 and new.current_stage is distinct from old.current_stage then
    insert into application_events (application_id, stage, notes)
    values (new.id, new.current_stage, 'Stage updated manually');
  end if;
  return new;
end;
$$ language plpgsql;

drop trigger if exists trg_applications_log_stage_change on applications;
create trigger trg_applications_log_stage_change
  after update of current_stage on applications
  for each row execute function log_stage_change();

-- ---------------------------------------------------------------------------
-- Funnel progress per application, based on every stage it ever reached,
-- not just where it sits today (an app rejected after an onsite still
-- counts as an interview).
-- ---------------------------------------------------------------------------
create or replace view application_progress
with (security_invoker = true) as
select
  a.id as application_id,
  a.current_stage,
  a.next_action_date,
  coalesce(bool_or(e.stage in ('oa','phone_screen','behavioral','technical_interview','onsite','offer','rejected')), false) as got_response,
  coalesce(bool_or(e.stage in ('phone_screen','behavioral','technical_interview','onsite','offer')), false) as reached_interview,
  coalesce(max(e.event_date), a.created_at) as last_activity_at
from applications a
left join application_events e on e.application_id = a.id
group by a.id;
