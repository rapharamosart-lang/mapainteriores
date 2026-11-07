-- Execute no SQL Editor do projeto moerbwpubdgjnenczgoq.
-- Isolamento por usuário: não compartilha automaticamente projetos entre funcionários.
begin;
create table public.bartz_projects (
 id uuid primary key,
 owner_id uuid not null references auth.users(id),
 name text not null check (char_length(name) between 1 and 100),
 mode text not null check (mode in ('realism', 'upscale')),
 original_path text not null,
 result_path text,
 created_at timestamptz not null default now(),
 constraint bartz_original_path check (original_path = owner_id::text || '/' || id::text || '/original'),
 constraint bartz_result_path check (result_path is null or result_path = owner_id::text || '/' || id::text || '/result')
);
alter table public.bartz_projects enable row level security;
revoke all on public.bartz_projects from anon;
grant select, insert, update, delete on public.bartz_projects to authenticated;
create policy bartz_projects_owner on public.bartz_projects for all to authenticated
 using ((select auth.uid()) = owner_id) with check ((select auth.uid()) = owner_id);
create index bartz_projects_owner_created on public.bartz_projects(owner_id, created_at desc);
insert into storage.buckets (id,name,public,file_size_limit,allowed_mime_types)
 values ('bartz-renders','bartz-renders',false,20971520,array['image/png','image/jpeg']);
create policy bartz_images_read on storage.objects for select to authenticated
 using (bucket_id='bartz-renders' and (storage.foldername(name))[1]=(select auth.uid())::text);
create policy bartz_images_insert on storage.objects for insert to authenticated
 with check (bucket_id='bartz-renders' and (storage.foldername(name))[1]=(select auth.uid())::text);
create policy bartz_images_update on storage.objects for update to authenticated
 using (bucket_id='bartz-renders' and (storage.foldername(name))[1]=(select auth.uid())::text)
 with check (bucket_id='bartz-renders' and (storage.foldername(name))[1]=(select auth.uid())::text);
create policy bartz_images_delete on storage.objects for delete to authenticated
 using (bucket_id='bartz-renders' and (storage.foldername(name))[1]=(select auth.uid())::text);
commit;
