-- Prevent payment status changes after a request-specific coupon has been issued.
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

  -- Lock the exact request so coupon issuance and payment changes cannot race.
  perform 1
  from public.book_coupon_requests r
  where r.id = p_request_id
    and r.seller_id = v_user_id
    and r.status = 'pending'
  for update;

  if not found then
    raise exception 'Ombi halijapatikana au tayari limehudumiwa.';
  end if;

  -- Once a coupon exists for this request, payment confirmation is immutable.
  if exists (
    select 1 from public.book_access_codes c
    where c.request_id = p_request_id
  ) then
    raise exception 'Coupon tayari imetengenezwa; uthibitisho wa malipo hauwezi kubadilishwa.';
  end if;

  update public.book_coupon_requests r
  set payment_status = p_status,
      payment_confirmed_at = case when p_status = 'received' then now() else null end,
      payment_confirmed_by = case when p_status = 'received' then v_user_id else null end
  where r.id = p_request_id
    and r.seller_id = v_user_id
    and r.status = 'pending';

  return true;
end;
$$;

revoke all on function public.set_book_coupon_payment_status(uuid, text) from public, anon;
grant execute on function public.set_book_coupon_payment_status(uuid, text) to authenticated;
