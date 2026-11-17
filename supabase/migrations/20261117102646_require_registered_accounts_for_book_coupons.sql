-- Only registered accounts may create or redeem book coupons.
drop policy if exists "seller reads own book access codes" on public.book_access_codes;
create policy "seller reads own book access codes" on public.book_access_codes for select to authenticated
using (coalesce((auth.jwt() ->> 'is_anonymous')::boolean, false) = false
  and (seller_id = (select auth.uid()) or (select private.is_admin())));

drop policy if exists "seller creates own book access codes" on public.book_access_codes;
create policy "seller creates own book access codes" on public.book_access_codes for insert to authenticated
with check (
  coalesce((auth.jwt() ->> 'is_anonymous')::boolean, false) = false
  and seller_id = (select auth.uid())
  and exists (select 1 from public.seller_applications sa where sa.user_id = (select auth.uid()) and sa.status = 'approved')
  and exists (select 1 from public.books b where b.id = book_id and b.seller_id = (select auth.uid()) and b.status = 'approved' and b.price_tzs > 0)
);

drop policy if exists "seller revokes unused own book access codes" on public.book_access_codes;
create policy "seller revokes unused own book access codes" on public.book_access_codes for update to authenticated
using (coalesce((auth.jwt() ->> 'is_anonymous')::boolean, false) = false
  and seller_id = (select auth.uid()) and redeemed_at is null and revoked_at is null)
with check (seller_id = (select auth.uid()) and redeemed_at is null);

drop policy if exists "buyer reads own book entitlements" on public.book_entitlements;
create policy "buyer reads own book entitlements" on public.book_entitlements for select to authenticated
using (coalesce((auth.jwt() ->> 'is_anonymous')::boolean, false) = false
  and (buyer_id = (select auth.uid()) or (select private.is_admin())));

create or replace function private.redeem_book_access_code(p_code text)
returns uuid language plpgsql security definer set search_path = ''
as $$
declare
  v_user_id uuid := auth.uid();
  v_code_id uuid;
  v_book_id uuid;
  v_normalized text;
begin
  if v_user_id is null or coalesce((auth.jwt() ->> 'is_anonymous')::boolean, false) then
    raise exception 'Ingia au jisajili kwa akaunti ya kawaida ili kutumia coupon.';
  end if;
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
