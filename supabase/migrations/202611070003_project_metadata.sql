begin;
alter table public.bartz_projects add column if not exists metadata jsonb not null default '{}'::jsonb;
-- Existing owner-based row level security continues to govern this data.
commit;
