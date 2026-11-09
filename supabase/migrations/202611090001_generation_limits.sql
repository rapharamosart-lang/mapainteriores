begin;
create table if not exists public.bartz_generation_limits (
 owner_id uuid primary key references auth.users(id) on delete cascade,
 usage_day date not null,
 attempts integer not null default 0,
 last_attempt timestamptz not null
);
alter table public.bartz_generation_limits enable row level security;
revoke all on public.bartz_generation_limits from anon, authenticated;
create or replace function public.bartz_reserve_generation() returns boolean
language plpgsql security definer set search_path = '' as $$
declare changed integer;
begin
 if auth.uid() is null then return false; end if;
 insert into public.bartz_generation_limits as existing(owner_id,usage_day,attempts,last_attempt)
 values(auth.uid(),(now() at time zone 'UTC')::date,1,now())
 on conflict(owner_id) do update set
 usage_day=excluded.usage_day,
 attempts=case when existing.usage_day=excluded.usage_day then existing.attempts+1 else 1 end,
 last_attempt=now()
 where (existing.usage_day<>excluded.usage_day or existing.attempts<5)
 and existing.last_attempt<now()-interval '3 minutes';
 get diagnostics changed=row_count;
 return changed=1;
end;
$$;
revoke all on function public.bartz_reserve_generation() from public,anon;
grant execute on function public.bartz_reserve_generation() to authenticated;
commit;
