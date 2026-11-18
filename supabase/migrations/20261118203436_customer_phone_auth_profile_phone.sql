create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path to 'public'
as $function$
begin
  insert into public.profiles (id, full_name, email, phone, preferred_language)
  values (
    new.id,
    coalesce(new.raw_user_meta_data->>'full_name', ''),
    new.email,
    new.phone,
    case when new.raw_user_meta_data->>'preferred_language' = 'en' then 'en' else 'sw' end
  )
  on conflict (id) do nothing;
  return new;
end;
$function$;
