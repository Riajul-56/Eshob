-- =============================================================================
-- 0003_storage.sql
-- Creates a public "assets" storage bucket for logos and reward images,
-- and the policies that let signed-in businesses upload while everyone can view.
-- Run in Supabase SQL Editor after 0002. Safe to re-run.
-- =============================================================================

-- public bucket (readable by anyone, so <img src> works)
insert into storage.buckets (id, name, public)
values ('assets', 'assets', true)
on conflict (id) do nothing;

-- anyone can read files in this bucket
drop policy if exists "assets public read" on storage.objects;
create policy "assets public read"
  on storage.objects for select
  using (bucket_id = 'assets');

-- signed-in users can upload
drop policy if exists "assets auth insert" on storage.objects;
create policy "assets auth insert"
  on storage.objects for insert to authenticated
  with check (bucket_id = 'assets');

-- signed-in users can replace / remove
drop policy if exists "assets auth update" on storage.objects;
create policy "assets auth update"
  on storage.objects for update to authenticated
  using (bucket_id = 'assets');

drop policy if exists "assets auth delete" on storage.objects;
create policy "assets auth delete"
  on storage.objects for delete to authenticated
  using (bucket_id = 'assets');
