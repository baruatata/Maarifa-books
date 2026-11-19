-- Link seller payment confirmation to the exact customer coupon request.
alter table public.book_coupon_requests
  add column if not exists payment_status text not null default 'unverified',
  add column if not exists payment_confirmed_at timestamptz,
  add column if not exists payment_confirmed_by uuid references public.profiles(id) on delete set null;

alter table public.book_coupon_requests
  drop constraint if exists book_coupon_requests_payment_status_check;
alter table public.book_coupon_requests
  add constraint book_coupon_requests_payment_status_check
  check (payment_status in ('unverified', 'received', 'not_received'));

alter table public.book_access_codes
  add column if not exists request_id uuid references public.book_coupon_requests(id) on delete set null;

create unique index if not exists book_access_codes_request_id_unique
  on public.book_access_codes(request_id) where request_id is not null;

-- Keep payment confirmation fields writable only through the checked RPC below.
revoke update on public.book_coupon_requests from authenticated;
grant update (status, fulfilled_at) on public.book_coupon_requests to authenticated;

create or replace function public.set_book_coupon_payment_status(p_request_id uuid, p_status text)
returns boolean
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_user_id uuid := auth.uid();
begin
  if v_user_id is null or coalesce((auth.jwt() ->> 'is_anonymous')::boolean, false) then
    raise exception 'Ingia kwenye akaunti ya muuzaji.';
  end if;
  if p_status not in ('received', 'not_received') then
    raise exception 'Hali ya malipo si sahihi.';
  end if;
  if not exists (
    select 1 from public.seller_applications sa
    where sa.user_id = v_user_id and sa.status = 'approved'
  ) then
    raise exception 'Akaunti ya muuzaji haijaidhinishwa.';
  end if;

  update public.book_coupon_requests r
  set payment_status = p_status,
      payment_confirmed_at = case when p_status = 'received' then now() else null end,
      payment_confirmed_by = case when p_status = 'received' then v_user_id else null end
  where r.id = p_request_id
    and r.seller_id = v_user_id
    and r.status = 'pending';

  if not found then
    raise exception 'Ombi halijapatikana au tayari limehudumiwa.';
  end if;
  return true;
end;
$$;

create or replace function public.create_book_coupon_for_request(p_request_id uuid, p_code_hash text)
returns boolean
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_user_id uuid := auth.uid();
  v_book_id uuid;
begin
  if v_user_id is null or coalesce((auth.jwt() ->> 'is_anonymous')::boolean, false) then
    raise exception 'Ingia kwenye akaunti ya muuzaji.';
  end if;
  if p_code_hash !~ '^[a-f0-9]{64}$' then
    raise exception 'Coupon haijatengenezwa kwa usahihi.';
  end if;
  if not exists (
    select 1 from public.seller_applications sa
    where sa.user_id = v_user_id and sa.status = 'approved'
  ) then
    raise exception 'Akaunti ya muuzaji haijaidhinishwa.';
  end if;

  select r.book_id into v_book_id
  from public.book_coupon_requests r
  join public.books b on b.id = r.book_id
  where r.id = p_request_id
    and r.seller_id = v_user_id
    and r.status = 'pending'
    and r.payment_status = 'received'
    and b.seller_id = v_user_id
    and b.status = 'approved'
    and b.price_tzs > 0
  for update of r;

  if v_book_id is null then
    raise exception 'Thibitisha kupokea malipo kabla ya kutengeneza coupon.';
  end if;

  insert into public.book_access_codes (book_id, seller_id, code_hash, request_id)
  values (v_book_id, v_user_id, p_code_hash, p_request_id);
  return true;
exception
  when unique_violation then
    raise exception 'Tayari kuna coupon ya ombi hili. Usitengeneze nyingine.';
end;
$$;

revoke all on function public.set_book_coupon_payment_status(uuid, text) from public, anon;
revoke all on function public.create_book_coupon_for_request(uuid, text) from public, anon;
grant execute on function public.set_book_coupon_payment_status(uuid, text) to authenticated;
grant execute on function public.create_book_coupon_for_request(uuid, text) to authenticated;

drop policy if exists "seller updates own coupon request status" on public.book_coupon_requests;
create policy "seller updates own coupon request status"
on public.book_coupon_requests for update to authenticated
using (seller_id = (select auth.uid()) and status = 'pending')
with check (
  seller_id = (select auth.uid())
  and status in ('pending','fulfilled','rejected')
  and (
    status <> 'fulfilled'
    or (
      payment_status = 'received'
      and exists (
        select 1 from public.book_access_codes c
        where c.request_id = book_coupon_requests.id
          and c.seller_id = (select auth.uid())
          and c.book_id = book_coupon_requests.book_id
      )
    )
  )
);
