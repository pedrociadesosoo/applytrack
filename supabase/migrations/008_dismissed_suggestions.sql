-- 008: remember which calendar suggestions you've marked done or skipped.
create table if not exists dismissed_suggestions (
  user_id uuid not null default auth.uid() references auth.users(id) on delete cascade,
  key text not null,
  created_at timestamptz not null default now(),
  primary key (user_id, key)
);

alter table dismissed_suggestions enable row level security;
drop policy if exists "own_dismissed_suggestions" on dismissed_suggestions;
create policy "own_dismissed_suggestions" on dismissed_suggestions
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);
