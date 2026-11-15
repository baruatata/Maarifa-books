revoke all on function public.is_admin() from public, anon, authenticated;
drop function if exists public.is_admin();
