create or replace function public.require_verified_seller_phone()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if not exists (
    select 1 from public.seller_phone_otps o
    where o.phone_e164 = new.phone_number
      and o.verified_at is not null
      and o.expires_at > now()
  ) then
    raise exception 'Namba ya simu lazima ithibitishwe kwa OTP kabla ya kutuma ombi.';
  end if;
  return new;
end;
$$;
revoke all on function public.require_verified_seller_phone() from public, anon, authenticated;
drop trigger if exists seller_application_requires_verified_phone on public.seller_applications;
create trigger seller_application_requires_verified_phone
before insert on public.seller_applications
for each row execute function public.require_verified_seller_phone();
