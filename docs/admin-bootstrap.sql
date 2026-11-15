-- Run once in Supabase Dashboard > SQL Editor after creating and verifying your own account.
-- Replace the email placeholder with the exact email used to sign in to MaarifaBooks.
-- This bootstrap is intentionally a manual project-owner operation, not a public registration feature.
do $$
declare
  affected integer;
begin
  execute 'alter table public.profiles disable trigger protect_profile_privileges';
  update public.profiles p
  set role = 'admin'::public.app_role,
      updated_at = now()
  from auth.users u
  where p.id = u.id
    and lower(u.email) = lower('REPLACE-WITH-YOUR-LOGIN-EMAIL');
  get diagnostics affected = row_count;
  execute 'alter table public.profiles enable trigger protect_profile_privileges';
  if affected <> 1 then
    raise exception 'Expected exactly one matching profile; updated % rows. Check that the account exists and the email is exact.', affected;
  end if;
end $$;

select p.id, p.full_name, p.email, p.role
from public.profiles p
where p.role = 'admin';
