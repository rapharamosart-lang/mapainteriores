set role authenticated;
select set_config('request.jwt.claim.sub','00000000-0000-4000-8000-000000000001',false),set_config('request.jwt.claims','{"email":"owner@example.invalid"}',false);
insert into public.bartz_installation_jobs(id,project_id,title,designer_email,installer_email) values('20000000-0000-4000-8000-000000000001','10000000-0000-4000-8000-000000000001','Cozinha','designer@example.invalid','installer@example.invalid');
insert into public.bartz_installation_parts(id,job_id,room,furniture,name,expected) values('30000000-0000-4000-8000-000000000001','20000000-0000-4000-8000-000000000001','Cozinha','Armário','Gaveteiro',1);
select set_config('request.jwt.claim.sub','00000000-0000-4000-8000-000000000003',false),set_config('request.jwt.claims','{"email":"installer@example.invalid"}',false);
do $$begin
 assert (select count(*) from public.bartz_installation_jobs)=1;
 assert (select count(*) from public.bartz_projects)=0;
 update public.bartz_installation_jobs set designer_email='outsider@example.invalid';assert not found;
end$$;
insert into public.bartz_installation_issues(id,job_id,part_id,quantity,reason) values('40000000-0000-4000-8000-000000000001','20000000-0000-4000-8000-000000000001','30000000-0000-4000-8000-000000000001',1,'factory_missing');
update public.bartz_installation_issues set status='requested' where id='40000000-0000-4000-8000-000000000001';
do $$begin
 assert (select count(*) from public.bartz_installation_notifications)=0;
 begin update public.bartz_installation_issues set created_by='00000000-0000-4000-8000-000000000004';raise exception 'Author spoof allowed';exception when insufficient_privilege then null;end;
 begin insert into public.bartz_installation_notifications(job_id,issue_id,recipient_email,message) values('20000000-0000-4000-8000-000000000001','40000000-0000-4000-8000-000000000001','outsider@example.invalid','forged');raise exception 'Notification forgery allowed';exception when insufficient_privilege then null;end;
end$$;
select set_config('request.jwt.claim.sub','00000000-0000-4000-8000-000000000004',false),set_config('request.jwt.claims','{"email":"outsider@example.invalid"}',false);
do $$begin
 assert (select count(*) from public.bartz_installation_jobs)=0;
 assert (select count(*) from public.bartz_installation_parts)=0;
 assert (select count(*) from public.bartz_installation_issues)=0;
 assert (select count(*) from public.bartz_installation_notifications)=0;
 begin insert into public.bartz_installation_issues(job_id,part_id,quantity,reason) values('20000000-0000-4000-8000-000000000001','30000000-0000-4000-8000-000000000001',1,'other');raise exception 'Foreign issue insertion allowed';exception when insufficient_privilege then null;end;
 begin insert into public.bartz_installation_jobs(project_id,title,designer_email,installer_email) values('10000000-0000-4000-8000-000000000001','Foreign project','outsider@example.invalid','installer@example.invalid');raise exception 'Foreign project binding allowed';exception when insufficient_privilege then null;end;
end$$;
select set_config('request.jwt.claim.sub','00000000-0000-4000-8000-000000000002',false),set_config('request.jwt.claims','{"email":"designer@example.invalid"}',false);
do $$begin assert (select count(*) from public.bartz_installation_issues)=1;assert (select count(*) from public.bartz_installation_notifications)=2;end$$;
update public.bartz_installation_notifications set read_at=now();
select set_config('request.jwt.claim.sub','00000000-0000-4000-8000-000000000001',false),set_config('request.jwt.claims','{"email":"owner@example.invalid"}',false);
do $$begin assert (select count(*) from public.bartz_installation_notifications where read_at is null)=2;end$$;
update public.bartz_installation_jobs set designer_email='new-designer@example.invalid';
select set_config('request.jwt.claim.sub','00000000-0000-4000-8000-000000000002',false),set_config('request.jwt.claims','{"email":"designer@example.invalid"}',false);
do $$begin assert (select count(*) from public.bartz_installation_jobs)=0;assert (select count(*) from public.bartz_installation_notifications)=0;end$$;
reset role;set role anon;
do $$begin begin perform count(*) from public.bartz_installation_jobs;raise exception 'Anonymous read allowed';exception when insufficient_privilege then null;end;end$$;
reset role;
select 'PASS: membership, private project isolation, notifications per recipient, no forged authors/notifications, revoke membership, anonymous denied.';
