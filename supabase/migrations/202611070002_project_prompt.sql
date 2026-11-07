-- Apply after 202611070001_bartz_studio.sql. Existing RLS policies remain in force.
begin;
alter table public.bartz_projects add column if not exists prompt text;
commit;
