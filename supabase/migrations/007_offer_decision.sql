-- 007: what you did with an offer. The stage stays "offer"; this records
-- the decision on top of it. NULL on an offer means "still deciding".
alter table applications
  add column if not exists offer_decision text
  check (offer_decision in ('pending', 'accepted', 'declined'));
