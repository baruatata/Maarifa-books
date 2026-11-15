-- MaarifaBooks initial schema. This version was applied to the hosted project as migration 20261115220710.
create extension if not exists pgcrypto;

do $$ begin create type public.app_role as enum ('buyer','seller','admin'); exception when duplicate_object then null; end $$;
do $$ begin create type public.seller_review_status as enum ('pending','approved','rejected','suspended'); exception when duplicate_object then null; end $$;
do $$ begin create type public.book_format as enum ('pdf','epub','audiobook'); exception when duplicate_object then null; end $$;
do $$ begin create type public.book_review_status as enum ('draft','pending','approved','rejected','archived'); exception when duplicate_object then null; end $$;
do $$ begin create type public.order_status as enum ('pending','paid','failed','refunded','cancelled'); exception when duplicate_object then null; end $$;

create table if not exists public.profiles (
 id uuid primary key references auth.users(id) on delete cascade,
 full_name text,
 phone text,
 email text,
 preferred_language text not null default 'sw' check (preferred_language in ('sw','en')),
 role public.app_role not null default 'buyer',
 seller_status public.seller_review_status,
 created_at timestamptz not null default now(),
 updated_at timestamptz not null default now()
);
create table if not exists public.seller_applications (
 id uuid primary key default gen_random_uuid(),
 user_id uuid not null unique references public.profiles(id) on delete cascade,
 store_name text not null,
 bio text,
 phone_number text not null,
 status public.seller_review_status not null default 'pending',
 reviewed_by uuid references public.profiles(id),
 reviewed_at timestamptz,
 review_note text,
 created_at timestamptz not null default now()
);
create table if not exists public.books (
 id uuid primary key default gen_random_uuid(),
 seller_id uuid not null references public.profiles(id),
 title text not null,
 description text,
 author_name text,
 language text not null default 'sw' check (language in ('sw','en','other')),
 category text,
 format public.book_format not null,
 price_tzs integer not null check (price_tzs >= 0),
 cover_path text,
 file_path text,
 preview_path text,
 status public.book_review_status not null default 'draft',
 rejection_note text,
 approved_by uuid references public.profiles(id),
 approved_at timestamptz,
 created_at timestamptz not null default now(),
 updated_at timestamptz not null default now()
);
create table if not exists public.orders (
 id uuid primary key default gen_random_uuid(),
 buyer_id uuid not null references public.profiles(id),
 total_tzs integer not null check (total_tzs >= 0),
 status public.order_status not null default 'pending',
 payment_provider text,
 provider_reference text unique,
 paid_at timestamptz,
 created_at timestamptz not null default now()
);
create table if not exists public.order_items (
 id uuid primary key default gen_random_uuid(),
 order_id uuid not null references public.orders(id) on delete cascade,
 book_id uuid not null references public.books(id),
 seller_id uuid not null references public.profiles(id),
 unit_price_tzs integer not null check (unit_price_tzs >= 0),
 created_at timestamptz not null default now()
);
create table if not exists public.seller_payments (
 id uuid primary key default gen_random_uuid(),
 order_item_id uuid not null unique references public.order_items(id),
 seller_id uuid not null references public.profiles(id),
 amount_tzs integer not null check (amount_tzs >= 0),
 phone_number text not null,
 provider text,
 provider_reference text unique,
 status text not null default 'pending' check (status in ('pending','processing','paid','failed')),
 paid_at timestamptz,
 created_at timestamptz not null default now()
);
create table if not exists public.marketing_consents (
 id uuid primary key default gen_random_uuid(),
 user_id uuid not null references public.profiles(id) on delete cascade,
 channel text not null check (channel in ('email','sms','whatsapp')),
 consented boolean not null default false,
 consent_text_version text not null default 'v1',
 consented_at timestamptz,
 withdrawn_at timestamptz,
 created_at timestamptz not null default now(),
 unique(user_id,channel)
);

create or replace function public.is_admin() returns boolean
language sql stable security definer set search_path = public
as $$ select exists(select 1 from public.profiles where id = auth.uid() and role = 'admin'); $$;
revoke all on function public.is_admin() from public;
grant execute on function public.is_admin() to authenticated;

create or replace function public.handle_new_user() returns trigger
language plpgsql security definer set search_path = public
as $$ begin
 insert into public.profiles(id,full_name,phone,email,preferred_language)
 values(new.id, coalesce(new.raw_user_meta_data->>'full_name',''), new.raw_user_meta_data->>'phone', new.email,
 case when new.raw_user_meta_data->>'preferred_language'='en' then 'en' else 'sw' end)
 on conflict(id) do nothing;
 return new;
end; $$;
revoke all on function public.handle_new_user() from public, anon, authenticated;
drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created after insert on auth.users for each row execute function public.handle_new_user();

alter table public.profiles enable row level security;
alter table public.seller_applications enable row level security;
alter table public.books enable row level security;
alter table public.orders enable row level security;
alter table public.order_items enable row level security;
alter table public.seller_payments enable row level security;
alter table public.marketing_consents enable row level security;

grant select, update on public.profiles to authenticated;
grant select, insert, update on public.seller_applications to authenticated;
grant select, insert, update, delete on public.books to authenticated;
grant select, insert on public.orders to authenticated;
grant select on public.order_items to authenticated;
grant select on public.seller_payments to authenticated;
grant select, insert, update on public.marketing_consents to authenticated;
grant select on public.books to anon;

drop policy if exists "profiles read self or admin" on public.profiles;
create policy "profiles read self or admin" on public.profiles for select to authenticated using(id=auth.uid() or public.is_admin());
drop policy if exists "profiles update self or admin" on public.profiles;
create policy "profiles update self or admin" on public.profiles for update to authenticated using(id=auth.uid() or public.is_admin()) with check(id=auth.uid() or public.is_admin());

drop policy if exists "seller application own insert" on public.seller_applications;
create policy "seller application own insert" on public.seller_applications for insert to authenticated with check(user_id=auth.uid() and status='pending');
drop policy if exists "seller application own or admin read" on public.seller_applications;
create policy "seller application own or admin read" on public.seller_applications for select to authenticated using(user_id=auth.uid() or public.is_admin());
drop policy if exists "seller application admin update" on public.seller_applications;
create policy "seller application admin update" on public.seller_applications for update to authenticated using(public.is_admin()) with check(public.is_admin());

drop policy if exists "approved books public read" on public.books;
create policy "approved books public read" on public.books for select to anon,authenticated using(status='approved' or seller_id=auth.uid() or public.is_admin());
drop policy if exists "seller insert own books" on public.books;
create policy "seller insert own books" on public.books for insert to authenticated with check(seller_id=auth.uid() and status in ('draft','pending'));
drop policy if exists "seller update own unapproved books" on public.books;
create policy "seller update own unapproved books" on public.books for update to authenticated using(seller_id=auth.uid() or public.is_admin()) with check((seller_id=auth.uid() and status in ('draft','pending')) or public.is_admin());
drop policy if exists "admin delete books" on public.books;
create policy "admin delete books" on public.books for delete to authenticated using(public.is_admin());

drop policy if exists "buyer create own pending orders" on public.orders;
create policy "buyer create own pending orders" on public.orders for insert to authenticated with check(buyer_id=auth.uid() and status='pending');
drop policy if exists "buyer read own orders or admin" on public.orders;
create policy "buyer read own orders or admin" on public.orders for select to authenticated using(buyer_id=auth.uid() or public.is_admin());
drop policy if exists "order item buyer seller admin read" on public.order_items;
create policy "order item buyer seller admin read" on public.order_items for select to authenticated using(public.is_admin() or seller_id=auth.uid() or exists(select 1 from public.orders o where o.id=order_id and o.buyer_id=auth.uid()));
drop policy if exists "seller own payment read or admin" on public.seller_payments;
create policy "seller own payment read or admin" on public.seller_payments for select to authenticated using(seller_id=auth.uid() or public.is_admin());

drop policy if exists "consent own insert" on public.marketing_consents;
create policy "consent own insert" on public.marketing_consents for insert to authenticated with check(user_id=auth.uid());
drop policy if exists "consent own read" on public.marketing_consents;
create policy "consent own read" on public.marketing_consents for select to authenticated using(user_id=auth.uid() or public.is_admin());
drop policy if exists "consent own update" on public.marketing_consents;
create policy "consent own update" on public.marketing_consents for update to authenticated using(user_id=auth.uid()) with check(user_id=auth.uid());
