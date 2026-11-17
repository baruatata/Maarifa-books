-- Keep privileged code-redemption and seller-contact lookup logic outside the exposed public schema.
create or replace function private.redeem_book_access_code(p_code text)
returns uuid language plpgsql security definer set search_path = ''
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
  update public.book_access_codes c set redeemed_by = v_user_id, redeemed_at = now()
  where c.code_hash = encode(extensions.digest(v_normalized, 'sha256'), 'hex')
    and c.redeemed_at is null and c.revoked_at is null
    and (c.expires_at is null or c.expires_at > now())
    and exists (select 1 from public.books b where b.id = c.book_id and b.status = 'approved' and b.price_tzs > 0)
  returning c.id, c.book_id into v_code_id, v_book_id;
  if v_code_id is null then raise exception 'Coupon si sahihi, imeshatumika au muda wake umeisha.'; end if;
  insert into public.book_entitlements (buyer_id, book_id, source_code_id)
  values (v_user_id, v_book_id, v_code_id) on conflict (buyer_id, book_id) do nothing;
  return v_book_id;
end;
$$;
revoke all on function private.redeem_book_access_code(text) from public, anon;
grant usage on schema private to authenticated;
grant execute on function private.redeem_book_access_code(text) to authenticated;
create or replace function public.redeem_book_access_code(p_code text)
returns uuid language sql security invoker set search_path = ''
as $$ select private.redeem_book_access_code(p_code); $$;
revoke all on function public.redeem_book_access_code(text) from public, anon;
grant execute on function public.redeem_book_access_code(text) to authenticated;

create or replace function private.get_seller_whatsapp(p_seller_id uuid)
returns text language sql stable security definer set search_path = ''
as $$ select sa.phone_number from public.seller_applications sa where sa.user_id = p_seller_id and sa.status = 'approved' limit 1; $$;
revoke all on function private.get_seller_whatsapp(uuid) from public;
grant usage on schema private to anon, authenticated;
grant execute on function private.get_seller_whatsapp(uuid) to anon, authenticated;
create or replace function public.get_seller_whatsapp(p_seller_id uuid)
returns text language sql stable security invoker set search_path = ''
as $$ select private.get_seller_whatsapp(p_seller_id); $$;
revoke all on function public.get_seller_whatsapp(uuid) from public;
grant execute on function public.get_seller_whatsapp(uuid) to anon, authenticated;
