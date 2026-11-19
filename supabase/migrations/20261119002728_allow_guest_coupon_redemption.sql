-- Allow a buyer to redeem a one-time book coupon without creating a permanent account.
-- Anonymous Supabase users still receive a scoped auth.uid(), so entitlements remain private to that browser session.

create or replace function private.redeem_book_access_code(p_code text)
returns uuid
language plpgsql
security definer
set search_path = ''
as $function$
declare
  v_user_id uuid := auth.uid();
  v_code_id uuid;
  v_book_id uuid;
  v_normalized text;
begin
  if v_user_id is null then
    raise exception 'Kikao cha mteja hakijaanzishwa. Jaribu tena.';
  end if;

  v_normalized := upper(regexp_replace(coalesce(p_code, ''), '[^A-Za-z0-9]', '', 'g'));
  if length(v_normalized) < 12 or length(v_normalized) > 32 then
    raise exception 'Coupon si sahihi au imeshatumika.';
  end if;

  update public.book_access_codes c
  set redeemed_by = v_user_id, redeemed_at = now()
  where c.code_hash = encode(extensions.digest(v_normalized, 'sha256'), 'hex')
    and c.redeemed_at is null
    and c.revoked_at is null
    and (c.expires_at is null or c.expires_at > now())
    and exists (
      select 1 from public.books b
      where b.id = c.book_id and b.status = 'approved' and b.price_tzs > 0
    )
  returning c.id, c.book_id into v_code_id, v_book_id;

  if v_code_id is null then
    raise exception 'Coupon si sahihi, imeshatumika au muda wake umeisha.';
  end if;

  insert into public.book_entitlements (buyer_id, book_id, source_code_id)
  values (v_user_id, v_book_id, v_code_id)
  on conflict (buyer_id, book_id) do nothing;

  return v_book_id;
end;
$function$;

drop policy if exists "buyer reads own book entitlements" on public.book_entitlements;
create policy "buyer reads own book entitlements"
on public.book_entitlements
for select
to authenticated
using (buyer_id = (select auth.uid()));
