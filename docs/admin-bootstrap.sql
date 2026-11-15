-- RUN THIS ONCE in Supabase SQL Editor after you have created and verified your own MaarifaBooks account.
-- Replace the email below with the exact email address of YOUR account.
-- Do not expose or commit a service-role key. This SQL is intended for the project owner in the Supabase Dashboard SQL Editor.
update public.profiles p
set role = 'admin'::public.app_role,
    updated_at = now()
from auth.users u
where p.id = u.id
  and lower(u.email) = lower('REPLACE-WITH-YOUR-LOGIN-EMAIL');

-- Verify that exactly your account has admin role:
select p.id, p.full_name, p.email, p.role
from public.profiles p
where p.role = 'admin';
