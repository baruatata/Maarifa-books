create table if not exists public.seller_payout_methods (
  seller_id uuid primary key references auth.users(id) on delete cascade,
  provider text not null check (provider in ('mixx','mpesa','airtel_money','tigo_pesa')),
  phone_number text not null,
  account_name text not null,
  updated_at timestamptz not null default now()
);
alter table public.seller_payout_methods enable row level security;
create policy "seller read own payout method" on public.seller_payout_methods for select to authenticated using (seller_id = (select auth.uid()));
create policy "seller insert own payout method" on public.seller_payout_methods for insert to authenticated with check (seller_id = (select auth.uid()));
create policy "seller update own payout method" on public.seller_payout_methods for update to authenticated using (seller_id = (select auth.uid())) with check (seller_id = (select auth.uid()));
grant select,insert,update on public.seller_payout_methods to authenticated;
create policy "seller delete own books" on public.books for delete to authenticated using (seller_id = (select auth.uid()));
