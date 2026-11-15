create schema if not exists private;
revoke all on schema private from public, anon;
grant usage on schema private to authenticated;

create or replace function private.is_admin()
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select (select auth.uid()) is not null
     and exists (
       select 1 from public.profiles p
       where p.id = (select auth.uid())
         and p.role = 'admin'::public.app_role
     );
$$;
revoke all on function private.is_admin() from public, anon;
grant execute on function private.is_admin() to authenticated;

create or replace function public.protect_profile_privileges()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  if (new.role is distinct from old.role or new.seller_status is distinct from old.seller_status)
     and not private.is_admin() then
    raise exception 'Only an administrator can change account role or seller approval status';
  end if;
  new.updated_at := pg_catalog.now();
  return new;
end;
$$;
revoke all on function public.protect_profile_privileges() from public, anon, authenticated;

drop policy if exists "profiles read self or admin" on public.profiles;
create policy "profiles read self or admin" on public.profiles
for select to authenticated
using (id = (select auth.uid()) or (select private.is_admin()));

drop policy if exists "profiles update self or admin" on public.profiles;
create policy "profiles update self or admin" on public.profiles
for update to authenticated
using (id = (select auth.uid()) or (select private.is_admin()))
with check (id = (select auth.uid()) or (select private.is_admin()));

drop policy if exists "seller application own or admin read" on public.seller_applications;
create policy "seller application own or admin read" on public.seller_applications
for select to authenticated
using (user_id = (select auth.uid()) or (select private.is_admin()));

drop policy if exists "seller application admin update" on public.seller_applications;
create policy "seller application admin update" on public.seller_applications
for update to authenticated
using ((select private.is_admin()))
with check ((select private.is_admin()));

drop policy if exists "approved books public read" on public.books;
create policy "approved books public read" on public.books
for select to anon, authenticated
using (status = 'approved' or seller_id = (select auth.uid()) or (select private.is_admin()));

drop policy if exists "seller update own unapproved books" on public.books;
create policy "seller update own unapproved books" on public.books
for update to authenticated
using (seller_id = (select auth.uid()) or (select private.is_admin()))
with check (
  (seller_id = (select auth.uid()) and status in ('draft','pending'))
  or (select private.is_admin())
);

drop policy if exists "admin delete books" on public.books;
create policy "admin delete books" on public.books
for delete to authenticated
using ((select private.is_admin()));

drop policy if exists "buyer read own orders or admin" on public.orders;
create policy "buyer read own orders or admin" on public.orders
for select to authenticated
using (buyer_id = (select auth.uid()) or (select private.is_admin()));

drop policy if exists "order item buyer seller admin read" on public.order_items;
create policy "order item buyer seller admin read" on public.order_items
for select to authenticated
using (
  (select private.is_admin())
  or seller_id = (select auth.uid())
  or exists(select 1 from public.orders o where o.id = order_id and o.buyer_id = (select auth.uid()))
);

drop policy if exists "seller own payment read or admin" on public.seller_payments;
create policy "seller own payment read or admin" on public.seller_payments
for select to authenticated
using (seller_id = (select auth.uid()) or (select private.is_admin()));

drop policy if exists "consent own read" on public.marketing_consents;
create policy "consent own read" on public.marketing_consents
for select to authenticated
using (user_id = (select auth.uid()) or (select private.is_admin()));

-- Trigger-only function must never be callable as a REST RPC endpoint.
revoke all on function public.handle_new_user() from public, anon, authenticated;
