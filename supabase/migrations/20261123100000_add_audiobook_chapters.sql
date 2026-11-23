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
create policy "audiobook chapters visible by book access"
on public.book_audio_chapters for select to anon, authenticated
using (
  exists (select 1 from public.books b where b.id=book_id and
    (b.status='approved' or b.seller_id=auth.uid() or public.is_admin()))
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
