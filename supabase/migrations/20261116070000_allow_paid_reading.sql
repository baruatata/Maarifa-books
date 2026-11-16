-- Allow buyers to read purchased book files from the private bucket.
-- Access is granted only while the corresponding order is marked paid.
drop policy if exists "buyer read purchased book files" on storage.objects;
create policy "buyer read purchased book files"
on storage.objects for select to authenticated
using (
  bucket_id = 'book-files'
  and exists (
    select 1
    from public.books b
    join public.order_items oi on oi.book_id = b.id
    join public.orders o on o.id = oi.order_id
    where b.file_path = storage.objects.name
      and b.status = 'approved'
      and o.buyer_id = auth.uid()
      and o.status = 'paid'
  )
);
