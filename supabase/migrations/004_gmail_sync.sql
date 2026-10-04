-- 004: Gmail sync. Every scanned email is recorded once in email_signals
-- (so re-syncing never double-counts), and confident matches become
-- application_events tagged with the Gmail message id.

create table if not exists email_signals (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null default auth.uid() references auth.users(id) on delete cascade,

  gmail_message_id text not null,
  thread_id text,
  from_header text,
  subject text,
  snippet text,
  received_at timestamptz not null,

  kind text not null check (kind in ('applied', 'stage', 'unrelated')),
  suggested_stage application_stage,
  company_guess text,
  role_guess text,
  confidence text not null check (confidence in ('high', 'low')),
  reason text,

  -- auto_applied: acted on automatically      pending_review: waiting on you
  -- duplicate: matched something already known confirmed / dismissed: your call
  -- ignored: not an application email
  status text not null check (status in ('auto_applied', 'duplicate', 'pending_review', 'confirmed', 'dismissed', 'ignored')),
  application_id uuid references applications(id) on delete set null,

  created_at timestamptz not null default now(),
  unique (user_id, gmail_message_id)
);

create index if not exists idx_email_signals_user_status on email_signals (user_id, status);

alter table email_signals enable row level security;
drop policy if exists "own_email_signals" on email_signals;
create policy "own_email_signals" on email_signals
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

create table if not exists gmail_sync_state (
  user_id uuid primary key default auth.uid() references auth.users(id) on delete cascade,
  last_synced_at timestamptz,
  last_run_at timestamptz
);

alter table gmail_sync_state enable row level security;
drop policy if exists "own_gmail_sync_state" on gmail_sync_state;
create policy "own_gmail_sync_state" on gmail_sync_state
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

-- One event per email, ever.
create unique index if not exists uq_application_events_source_email
  on application_events (source_email_id) where source_email_id is not null;

-- Date the "Application created" event by when you applied, not when the row
-- was inserted. Otherwise an application created during an inbox backfill
-- would look newer than the OA/interview emails that followed it.
create or replace function log_initial_application_event()
returns trigger as $$
begin
  insert into application_events (application_id, stage, event_date, notes)
  values (new.id, new.current_stage, least(now(), new.application_date::timestamptz), 'Application created');
  return new;
end;
$$ language plpgsql;
