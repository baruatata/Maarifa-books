-- Private storage for seller book uploads and covers.
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'book-files',
  'book-files',
  false,
  104857600,
  array['application/pdf','application/epub+zip','audio/mpeg','audio/mp4','audio/aac','audio/x-m4a','image/jpeg','image/png','image/webp']
)
on conflict (id) do update set
  public = false,
  file_size_limit = 104857600,
  allowed_mime_types = excluded.allowed_mime_types;

drop policy if exists "seller upload own book files" on storage.objects;
create policy "seller upload own book files"
on storage.objects for insert to authenticated
with check (
  bucket_id = 'book-files'
  and (storage.foldername(name))[1] = auth.uid()::text
  and exists (
    select 1 from public.seller_applications sa
    where sa.user_id = auth.uid() and sa.status = 'approved'
  )
);

drop policy if exists "seller read own book files" on storage.objects;
create policy "seller read own book files"
on storage.objects for select to authenticated
using (
  bucket_id = 'book-files'
  and (
    (storage.foldername(name))[1] = auth.uid()::text
    or exists (select 1 from public.profiles p where p.id = auth.uid() and p.role = 'admin')
  )
);

drop policy if exists "seller update own book files" on storage.objects;
create policy "seller update own book files"
on storage.objects for update to authenticated
using (bucket_id = 'book-files' and (storage.foldername(name))[1] = auth.uid()::text)
with check (bucket_id = 'book-files' and (storage.foldername(name))[1] = auth.uid()::text);

drop policy if exists "seller delete own book files" on storage.objects;
create policy "seller delete own book files"
on storage.objects for delete to authenticated
using (
  bucket_id = 'book-files'
  and (
    (storage.foldername(name))[1] = auth.uid()::text
    or exists (select 1 from public.profiles p where p.id = auth.uid() and p.role = 'admin')
  )
);
