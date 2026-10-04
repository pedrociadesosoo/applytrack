-- ApplyTrack schema
-- Phase 1 data model: applications + application_events (stage history)
-- RLS is intentionally permissive in Phase 1 (single local user, no auth flow yet).
-- Phase 3 (Gmail OAuth) introduces Supabase Auth + tightens these policies to `auth.uid() = user_id`.

create extension if not exists "pgcrypto";

-- ---------------------------------------------------------------------------
-- Enums
-- ---------------------------------------------------------------------------

create type application_stage as enum (
  'applied',
  'oa',
  'phone_screen',
  'behavioral',
  'technical_interview',
  'onsite',
  'offer',
  'rejected',
  'ghosted',
  'withdrawn'
);

create type application_source as enum (
  'referral',
  'cold_apply',
  'career_fair',
  'linkedin',
  'company_site',
  'recruiter_outreach',
  'other'
);

-- ---------------------------------------------------------------------------
-- applications
-- ---------------------------------------------------------------------------

create table if not exists applications (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) default auth.uid(),

  company text not null,
  role_title text not null,
  application_date date not null default current_date,
  source application_source not null default 'other',

  current_stage application_stage not null default 'applied',

  next_action text,
  next_action_date date,

  -- Feature 1a: job description archive
  job_description text,
  job_post_url text,

  resume_version_used text,
  cover_letter_used text,

  contact_name text,
  contact_email text,

  -- Feature 4: optional self-rating after interview stages (1-5), one running note per application in Phase 1
  confidence_rating smallint check (confidence_rating between 1 and 5),

  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists idx_applications_user_id on applications (user_id);
create index if not exists idx_applications_current_stage on applications (current_stage);
create index if not exists idx_applications_updated_at on applications (updated_at desc);

-- Full-text search over job descriptions + company/role (Feature 1a: "show me every JD that mentioned SQL")
alter table applications add column if not exists search_vector tsvector
  generated always as (
    setweight(to_tsvector('english', coalesce(company, '')), 'A') ||
    setweight(to_tsvector('english', coalesce(role_title, '')), 'A') ||
    setweight(to_tsvector('english', coalesce(job_description, '')), 'B')
  ) stored;

create index if not exists idx_applications_search_vector on applications using gin (search_vector);

-- ---------------------------------------------------------------------------
-- application_events (stage history / audit trail)
-- ---------------------------------------------------------------------------

create table if not exists application_events (
  id uuid primary key default gen_random_uuid(),
  application_id uuid not null references applications(id) on delete cascade,

  stage application_stage not null,
  event_date timestamptz not null default now(),

  -- Populated in Phase 3 when Gmail classification creates the event automatically
  source_email_id text,

  notes text,
  created_at timestamptz not null default now()
);

create index if not exists idx_application_events_application_id on application_events (application_id);
create index if not exists idx_application_events_event_date on application_events (event_date);

-- ---------------------------------------------------------------------------
-- Keep updated_at fresh
-- ---------------------------------------------------------------------------

create or replace function set_updated_at()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

drop trigger if exists trg_applications_updated_at on applications;
create trigger trg_applications_updated_at
  before update on applications
  for each row execute function set_updated_at();

-- Auto-log the initial "applied" event whenever a new application is created
create or replace function log_initial_application_event()
returns trigger as $$
begin
  insert into application_events (application_id, stage, event_date, notes)
  values (new.id, new.current_stage, now(), 'Application created');
  return new;
end;
$$ language plpgsql;

drop trigger if exists trg_applications_log_initial_event on applications;
create trigger trg_applications_log_initial_event
  after insert on applications
  for each row execute function log_initial_application_event();

-- Stage-change triggers and the application_progress view live in
-- supabase/migrations/002_event_driven_stages.sql — run it right after this file.

-- ---------------------------------------------------------------------------
-- Row Level Security
-- ---------------------------------------------------------------------------

alter table applications enable row level security;
alter table application_events enable row level security;

-- Phase 1 (no auth yet): permissive policies scoped to the anon/service key used
-- from Next.js API routes. Replace with `auth.uid() = user_id` checks once
-- Google OAuth (Phase 3) is wired up.
create policy "phase1_allow_all_applications" on applications
  for all using (true) with check (true);

create policy "phase1_allow_all_application_events" on application_events
  for all using (true) with check (true);
