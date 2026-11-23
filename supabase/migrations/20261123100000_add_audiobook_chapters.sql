-- Chapter-based audiobooks. Existing PDF/EPUB schema and storage remain unchanged.
create table if not exists public.book_audio_chapters (
  id uuid primary key default gen_random_uuid(),
  book_id uuid not null references public.books(id) on delete cascade,
  seller_id uuid not null references public.profiles(id),
  chapter_index integer not null check (chapter_index > 0),
  title text not null check (length(trim(title)) between 1 and 180),
  audio_path text not null,
  is_preview boolean not null default false,
  created_at timestamptz not null default now(),
  unique(book_id, chapter_index),
  unique(audio_path)
);
alter table public.book_audio_chapters enable row level security;
grant select, insert, update, delete on public.book_audio_chapters to authenticated;
drop policy if exists "audiobook chapters visible by book access" on public.book_audio_chapters;
drop policy if exists "public reads approved audiobook chapters" on public.book_audio_chapters;
create policy "public reads approved audiobook chapters"
on public.book_audio_chapters for select to anon
using (exists (select 1 from public.books b where b.id=book_id and b.status='approved' and (b.price_tzs=0 or is_preview)));
drop policy if exists "authenticated reads audiobook chapters" on public.book_audio_chapters;
create policy "authenticated reads audiobook chapters"
on public.book_audio_chapters for select to authenticated
using (
  exists (
    select 1 from public.books b where b.id=book_id and (
      (b.status='approved' and (
        b.price_tzs=0 or is_preview or b.seller_id=auth.uid()
        or public.is_admin()
        or exists (select 1 from public.book_entitlements e where e.book_id=b.id and e.buyer_id=auth.uid())
      ))
      or b.seller_id=auth.uid() or public.is_admin()
    )
  )
);
drop policy if exists "seller manages own pending audiobook chapters" on public.book_audio_chapters;
create policy "seller manages own pending audiobook chapters"
on public.book_audio_chapters for all to authenticated
using (
  seller_id=auth.uid() and exists (select 1 from public.books b where b.id=book_id and b.seller_id=auth.uid() and b.status in ('draft','pending') and b.format='audiobook')
)
with check (
  seller_id=auth.uid() and exists (select 1 from public.books b where b.id=book_id and b.seller_id=auth.uid() and b.status in ('draft','pending') and b.format='audiobook')
);
create index if not exists book_audio_chapters_book_order_idx on public.book_audio_chapters(book_id,chapter_index);

-- Permit signed URLs only for chapters whose approved book access is valid.
grant select on public.book_audio_chapters to anon;
drop policy if exists "approved audiobook audio access" on storage.objects;
drop policy if exists "public approved audiobook audio access" on storage.objects;
create policy "public approved audiobook audio access"
on storage.objects for select to anon
using (
  bucket_id='book-files'
  and exists (
    select 1 from public.book_audio_chapters c
    join public.books b on b.id=c.book_id
    where c.audio_path=name and b.status='approved'
      and (b.price_tzs=0 or c.is_preview)
  )
);
drop policy if exists "authenticated approved audiobook audio access" on storage.objects;
create policy "authenticated approved audiobook audio access"
on storage.objects for select to authenticated
using (
  bucket_id='book-files'
  and exists (
    select 1 from public.book_audio_chapters c
    join public.books b on b.id=c.book_id
    where c.audio_path=name and b.status='approved'
      and (
        b.price_tzs=0 or c.is_preview or b.seller_id=auth.uid()
        or public.is_admin()
        or exists (select 1 from public.book_entitlements e where e.book_id=b.id and e.buyer_id=auth.uid())
      )
  )
);
