alter table public.profiles
  add column if not exists phone_verified_at timestamptz;

alter table public.seller_applications
  add column if not exists phone_verified_at timestamptz;

alter table public.seller_phone_otps
  add column if not exists user_id uuid references auth.users(id) on delete cascade;

create index if not exists seller_phone_otps_user_phone_created_idx
  on public.seller_phone_otps (user_id, phone_e164, created_at desc);

alter table public.seller_phone_otps enable row level security;
revoke all on table public.seller_phone_otps from anon, authenticated;
