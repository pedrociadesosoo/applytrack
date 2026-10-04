-- 005: HireVue / one-way video interview stage, between OA and phone screen.
-- Postgres won't use a new enum value in the same transaction that adds it,
-- so run this file on its own, then 006.
alter type application_stage add value if not exists 'hirevue' after 'oa';
