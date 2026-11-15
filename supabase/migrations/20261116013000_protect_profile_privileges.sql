create or replace function public.protect_profile_privileges()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if (new.role is distinct from old.role or new.seller_status is distinct from old.seller_status)
     and not public.is_admin() then
    raise exception 'Only an administrator can change account role or seller approval status';
  end if;
  new.updated_at := now();
  return new;
end;
$$;
revoke all on function public.protect_profile_privileges() from public, anon, authenticated;
drop trigger if exists protect_profile_privileges on public.profiles;
create trigger protect_profile_privileges
before update on public.profiles
for each row execute function public.protect_profile_privileges();
