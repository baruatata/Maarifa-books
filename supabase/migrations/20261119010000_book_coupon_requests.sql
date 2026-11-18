-- Customer coupon requests with seller-scoped notifications.
create table if not exists public.book_coupon_requests (
  id uuid primary key default gen_random_uuid(),
  book_id uuid not null references public.books(id) on delete cascade,
  seller_id uuid not null references public.profiles(id) on delete cascade,
  customer_user_id uuid references public.profiles(id) on delete set null,
  customer_name text,
  customer_phone text not null check (customer_phone ~ '^255[67][0-9]{8}$'),
  transaction_reference text not null check (length(transaction_reference) between 3 and 100),
  status text not null default 'pending' check (status in ('pending','fulfilled','rejected')),
  created_at timestamptz not null default now(),
  fulfilled_at timestamptz
);
create index if not exists book_coupon_requests_seller_status_idx
  on public.book_coupon_requests(seller_id,status,created_at desc);
alter table public.book_coupon_requests enable row level security;
grant insert on public.book_coupon_requests to anon, authenticated;
grant select, update on public.book_coupon_requests to authenticated;
drop policy if exists "public can request coupon for approved paid book" on public.book_coupon_requests;
create policy "public can request coupon for approved paid book"
on public.book_coupon_requests for insert to anon, authenticated
with check (
  status = 'pending' and ((auth.uid() is null and customer_user_id is null) or customer_user_id = auth.uid()) and fulfilled_at is null
  and exists (select 1 from public.books b where b.id=book_id and b.seller_id=book_coupon_requests.seller_id and b.status='approved' and b.price_tzs>0)
);
drop policy if exists "seller reads own coupon requests" on public.book_coupon_requests;
create policy "seller reads own coupon requests" on public.book_coupon_requests for select to authenticated
using (seller_id=auth.uid() or (select private.is_admin()));
drop policy if exists "seller updates own coupon request status" on public.book_coupon_requests;
create policy "seller updates own coupon request status" on public.book_coupon_requests for update to authenticated
using (seller_id=auth.uid() and status='pending')
with check (seller_id=auth.uid() and status in ('pending','fulfilled','rejected'));
