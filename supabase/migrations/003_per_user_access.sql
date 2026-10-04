-- 003: Google sign-in lands, so the Phase 1 "allow all" policies go away
-- and every row is scoped to its owner. Run after 002.

-- Google refresh tokens for the Gmail sync. RLS on with no policies:
-- only the server's service-role key can read or write this table.
create table if not exists google_credentials (
  user_id uuid primary key references auth.users(id) on delete cascade,
  refresh_token text not null,
  updated_at timestamptz not null default now()
);
alter table google_credentials enable row level security;

drop policy if exists "phase1_allow_all_applications" on applications;
drop policy if exists "phase1_allow_all_application_events" on application_events;

drop policy if exists "own_applications" on applications;
create policy "own_applications" on applications
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

drop policy if exists "own_application_events" on application_events;
create policy "own_application_events" on application_events
  for all
  using (exists (select 1 from applications a where a.id = application_id and a.user_id = auth.uid()))
  with check (exists (select 1 from applications a where a.id = application_id and a.user_id = auth.uid()));
