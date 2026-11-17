-- Seller WhatsApp contact, one-time book coupons, and protected paid-book previews.
alter table public.seller_applications
  add column if not exists terms_accepted_at timestamptz,
  add column if not exists terms_version text;

create table if not exists public.book_access_codes (
  id uuid primary key default gen_random_uuid(),
  book_id uuid not null references public.books(id) on delete cascade,
  seller_id uuid not null references public.profiles(id) on delete cascade,
  code_hash text not null unique check (code_hash ~ '^[a-f0-9]{64}$'),
  created_at timestamptz not null default now(),
  expires_at timestamptz,
  redeemed_by uuid references public.profiles(id) on delete set null,
  redeemed_at timestamptz,
  revoked_at timestamptz,
  constraint book_access_codes_valid_expiry check (expires_at is null or expires_at > created_at)
);

create table if not exists public.book_entitlements (
  id uuid primary key default gen_random_uuid(),
  buyer_id uuid not null references public.profiles(id) on delete cascade,
  book_id uuid not null references public.books(id) on delete cascade,
  source_code_id uuid not null unique references public.book_access_codes(id),
  created_at timestamptz not null default now(),
  unique (buyer_id, book_id)
);

create index if not exists book_access_codes_seller_book_idx on public.book_access_codes (seller_id, book_id, created_at desc);
create index if not exists book_entitlements_buyer_book_idx on public.book_entitlements (buyer_id, book_id);

alter table public.book_access_codes enable row level security;
alter table public.book_entitlements enable row level security;
grant select, insert, update on public.book_access_codes to authenticated;
grant select on public.book_entitlements to authenticated;

drop policy if exists "seller reads own book access codes" on public.book_access_codes;
create policy "seller reads own book access codes" on public.book_access_codes for select to authenticated
using (seller_id = (select auth.uid()) or (select private.is_admin()));

drop policy if exists "seller creates own book access codes" on public.book_access_codes;
create policy "seller creates own book access codes" on public.book_access_codes for insert to authenticated
with check (
  seller_id = (select auth.uid())
  and exists (select 1 from public.books b where b.id = book_id and b.seller_id = (select auth.uid()) and b.status = 'approved' and b.price_tzs > 0)
);

drop policy if exists "seller revokes unused own book access codes" on public.book_access_codes;
create policy "seller revokes unused own book access codes" on public.book_access_codes for update to authenticated
using (seller_id = (select auth.uid()) and redeemed_at is null and revoked_at is null)
with check (seller_id = (select auth.uid()) and redeemed_at is null);

drop policy if exists "buyer reads own book entitlements" on public.book_entitlements;
create policy "buyer reads own book entitlements" on public.book_entitlements for select to authenticated
using (buyer_id = (select auth.uid()) or (select private.is_admin()));

create or replace function public.redeem_book_access_code(p_code text)
returns uuid
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_user_id uuid := auth.uid();
  v_code_id uuid;
  v_book_id uuid;
  v_normalized text;
begin
  if v_user_id is null then raise exception 'Ingia kwenye akaunti ili kutumia coupon.'; end if;
  v_normalized := upper(regexp_replace(coalesce(p_code, ''), '[^A-Za-z0-9]', '', 'g'));
  if length(v_normalized) < 12 or length(v_normalized) > 32 then raise exception 'Coupon si sahihi au imeshatumika.'; end if;

  update public.book_access_codes c
  set redeemed_by = v_user_id, redeemed_at = now()
  where c.code_hash = encode(extensions.digest(v_normalized, 'sha256'), 'hex')
    and c.redeemed_at is null and c.revoked_at is null
    and (c.expires_at is null or c.expires_at > now())
    and exists (select 1 from public.books b where b.id = c.book_id and b.status = 'approved' and b.price_tzs > 0)
  returning c.id, c.book_id into v_code_id, v_book_id;

  if v_code_id is null then raise exception 'Coupon si sahihi, imeshatumika au muda wake umeisha.'; end if;
  insert into public.book_entitlements (buyer_id, book_id, source_code_id)
  values (v_user_id, v_book_id, v_code_id)
  on conflict (buyer_id, book_id) do nothing;
  return v_book_id;
end;
$$;
revoke all on function public.redeem_book_access_code(text) from public, anon;
grant execute on function public.redeem_book_access_code(text) to authenticated;

create or replace function public.get_seller_whatsapp(p_seller_id uuid)
returns text language sql stable security definer set search_path = ''
as $$
  select sa.phone_number from public.seller_applications sa
  where sa.user_id = p_seller_id and sa.status = 'approved' limit 1;
$$;
revoke all on function public.get_seller_whatsapp(uuid) from public;
grant execute on function public.get_seller_whatsapp(uuid) to anon, authenticated;

drop policy if exists "public read approved book files" on storage.objects;
drop policy if exists "buyer read purchased book files" on storage.objects;
drop policy if exists "public read approved free book files" on storage.objects;
create policy "public read approved free book files" on storage.objects for select to anon, authenticated
using (bucket_id = 'book-files' and exists (
  select 1 from public.books b where b.file_path = storage.objects.name and b.status = 'approved' and b.price_tzs = 0
));

drop policy if exists "public read approved book previews" on storage.objects;
create policy "public read approved book previews" on storage.objects for select to anon, authenticated
using (bucket_id = 'book-files' and exists (
  select 1 from public.books b where b.preview_path = storage.objects.name and b.status = 'approved' and b.price_tzs > 0
));

drop policy if exists "buyer read entitled book files" on storage.objects;
create policy "buyer read entitled book files" on storage.objects for select to authenticated
using (bucket_id = 'book-files' and exists (
  select 1 from public.books b
  join public.book_entitlements e on e.book_id = b.id
  where b.file_path = storage.objects.name and b.status = 'approved' and e.buyer_id = (select auth.uid())
));
