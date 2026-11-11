-- Montagem compartilhada: executar no SQL Editor após as migrações do Studio.
begin;
create table public.bartz_installation_jobs (
 id uuid primary key default gen_random_uuid(),
 project_id uuid not null references public.bartz_projects(id) on delete cascade,
 owner_id uuid not null default auth.uid() references auth.users(id),
 title text not null check(char_length(title) between 1 and 150),
 client text not null default '', address text not null default '',
 designer_name text not null default '', designer_email text not null,
 installer_name text not null default '', installer_email text not null,
 created_at timestamptz not null default now(),
 check(designer_email=lower(trim(designer_email)) and designer_email like '%@%'),
 check(installer_email=lower(trim(installer_email)) and installer_email like '%@%')
);
create table public.bartz_installation_parts (
 id uuid primary key default gen_random_uuid(), job_id uuid not null references public.bartz_installation_jobs(id) on delete cascade,
 room text not null check(char_length(room) between 1 and 100), furniture text not null check(char_length(furniture) between 1 and 150),
 name text not null check(char_length(name) between 1 and 150), code text not null default '',
 expected integer not null check(expected between 1 and 100000), received integer not null default 0, installed integer not null default 0,
 notes text not null default '' check(char_length(notes)<=2000), updated_at timestamptz not null default now(),
 unique(id,job_id),check(received between 0 and expected),check(installed between 0 and received)
);
create table public.bartz_installation_issues (
 id uuid primary key default gen_random_uuid(), job_id uuid not null references public.bartz_installation_jobs(id) on delete cascade,
 part_id uuid not null, quantity integer not null check(quantity between 1 and 100000),
 reason text not null check(reason in ('factory_missing','not_delivered','damaged','wrong','other')),
 status text not null default 'open' check(status in ('open','requested','in_transit','delivered','resolved')),
 notes text not null default '' check(char_length(notes)<=3000), factory_order text not null default '', eta date,
 created_by uuid not null default auth.uid() references auth.users(id), created_at timestamptz not null default now(), updated_at timestamptz not null default now(),
 foreign key(part_id,job_id) references public.bartz_installation_parts(id,job_id) on delete cascade
);
create table public.bartz_installation_notifications (
 id uuid primary key default gen_random_uuid(),job_id uuid not null references public.bartz_installation_jobs(id) on delete cascade,
 issue_id uuid not null references public.bartz_installation_issues(id) on delete cascade,
 recipient_id uuid references auth.users(id),recipient_email text,
 message text not null,created_at timestamptz not null default now(),read_at timestamptz,
 check(recipient_id is not null or recipient_email is not null)
);
alter table public.bartz_installation_jobs enable row level security;
alter table public.bartz_installation_parts enable row level security;
alter table public.bartz_installation_issues enable row level security;
alter table public.bartz_installation_notifications enable row level security;
revoke all on public.bartz_installation_jobs, public.bartz_installation_parts, public.bartz_installation_issues, public.bartz_installation_notifications from public,anon,authenticated;
grant select,insert,update on public.bartz_installation_jobs, public.bartz_installation_parts to authenticated;
grant select,insert on public.bartz_installation_issues to authenticated;
grant update(status,notes,factory_order,eta) on public.bartz_installation_issues to authenticated;
grant select on public.bartz_installation_notifications to authenticated;
grant update(read_at) on public.bartz_installation_notifications to authenticated;
create policy installation_job_read on public.bartz_installation_jobs for select to authenticated using (
 owner_id=(select auth.uid()) or designer_email=lower((select auth.jwt())->>'email') or installer_email=lower((select auth.jwt())->>'email')
);
create policy installation_job_create on public.bartz_installation_jobs for insert to authenticated with check (
 owner_id=(select auth.uid()) and exists(select 1 from public.bartz_projects p where p.id=project_id and p.owner_id=(select auth.uid()))
);
create policy installation_job_update on public.bartz_installation_jobs for update to authenticated using(owner_id=(select auth.uid())) with check(
 owner_id=(select auth.uid()) and exists(select 1 from public.bartz_projects p where p.id=project_id and p.owner_id=(select auth.uid()))
);
-- Reading a job through its own policy proves membership; no public project/image access is added.
create policy installation_part_read on public.bartz_installation_parts for select to authenticated using(exists(select 1 from public.bartz_installation_jobs j where j.id=job_id));
create policy installation_part_create on public.bartz_installation_parts for insert to authenticated with check(exists(select 1 from public.bartz_installation_jobs j where j.id=job_id));
create policy installation_part_update on public.bartz_installation_parts for update to authenticated using(exists(select 1 from public.bartz_installation_jobs j where j.id=job_id)) with check(exists(select 1 from public.bartz_installation_jobs j where j.id=job_id));
create policy installation_issue_read on public.bartz_installation_issues for select to authenticated using(exists(select 1 from public.bartz_installation_jobs j where j.id=job_id));
create policy installation_issue_create on public.bartz_installation_issues for insert to authenticated with check(created_by=(select auth.uid()) and exists(select 1 from public.bartz_installation_jobs j where j.id=job_id));
create policy installation_issue_update on public.bartz_installation_issues for update to authenticated using(exists(select 1 from public.bartz_installation_jobs j where j.id=job_id)) with check(exists(select 1 from public.bartz_installation_jobs j where j.id=job_id));
create policy installation_notification_read on public.bartz_installation_notifications for select to authenticated using(
 (recipient_id=(select auth.uid()) or recipient_email=lower((select auth.jwt())->>'email')) and exists(select 1 from public.bartz_installation_jobs j where j.id=job_id)
);
create policy installation_notification_update on public.bartz_installation_notifications for update to authenticated using(
 (recipient_id=(select auth.uid()) or recipient_email=lower((select auth.jwt())->>'email')) and exists(select 1 from public.bartz_installation_jobs j where j.id=job_id)
) with check((recipient_id=(select auth.uid()) or recipient_email=lower((select auth.jwt())->>'email')) and exists(select 1 from public.bartz_installation_jobs j where j.id=job_id));
create function public.bartz_installation_touch() returns trigger language plpgsql set search_path='' as $$begin new.updated_at=now();return new;end;$$;
create trigger installation_part_touch before update on public.bartz_installation_parts for each row execute function public.bartz_installation_touch();
create trigger installation_issue_touch before update on public.bartz_installation_issues for each row execute function public.bartz_installation_touch();
create function public.bartz_installation_notify() returns trigger language plpgsql security definer set search_path='' as $$
declare job public.bartz_installation_jobs;piece public.bartz_installation_parts;label text;owner_email text;
begin
 if TG_OP='UPDATE' and new.status=old.status then return new;end if;
 select * into job from public.bartz_installation_jobs where id=new.job_id;
 select * into piece from public.bartz_installation_parts where id=new.part_id;
 label=case when TG_OP='INSERT' then 'Nova pendência' else 'Pendência atualizada' end || ': ' || piece.room || ' / ' || piece.furniture || ' / ' || piece.name || ' (' || new.quantity || ')';
 insert into public.bartz_installation_notifications(job_id,issue_id,recipient_id,message) values(new.job_id,new.id,job.owner_id,label);
 select lower(email) into owner_email from auth.users where id=job.owner_id;
 if job.designer_email is distinct from owner_email then
 insert into public.bartz_installation_notifications(job_id,issue_id,recipient_email,message) values(new.job_id,new.id,job.designer_email,label);
 end if;
 return new;
end;$$;
revoke all on function public.bartz_installation_notify() from public,anon,authenticated;
revoke all on function public.bartz_installation_touch() from public,anon,authenticated;
create trigger installation_notify after insert or update on public.bartz_installation_issues for each row execute function public.bartz_installation_notify();
create index installation_jobs_designer on public.bartz_installation_jobs(designer_email);
create index installation_jobs_installer on public.bartz_installation_jobs(installer_email);
create index installation_parts_job on public.bartz_installation_parts(job_id);
create index installation_issues_job on public.bartz_installation_issues(job_id);
create index installation_notifications_recipient on public.bartz_installation_notifications(recipient_id,recipient_email,created_at desc);
commit;
