-- 009: editing an application's journey. After a step is changed or
-- removed, the current stage is recomputed from the latest step, without
-- the "Stage updated manually" logger adding an extra step.

create or replace function log_stage_change()
returns trigger as $$
begin
  if pg_trigger_depth() = 1
     and coalesce(current_setting('applytrack.skip_stage_log', true), 'off') <> 'on'
     and new.current_stage is distinct from old.current_stage then
    insert into application_events (application_id, stage, notes)
    values (new.id, new.current_stage, 'Stage updated manually');
  end if;
  return new;
end;
$$ language plpgsql;

create or replace function recompute_application_stage(p_app uuid)
returns application_stage as $$
declare
  latest application_stage;
begin
  select stage into latest
    from application_events
   where application_id = p_app
   order by event_date desc, created_at desc
   limit 1;
  if latest is null then
    return null;
  end if;
  perform set_config('applytrack.skip_stage_log', 'on', true);
  update applications set current_stage = latest
   where id = p_app and current_stage is distinct from latest;
  perform set_config('applytrack.skip_stage_log', 'off', true);
  return latest;
end;
$$ language plpgsql security invoker;
