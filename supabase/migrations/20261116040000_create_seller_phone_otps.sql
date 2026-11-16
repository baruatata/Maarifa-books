create table if not exists public.seller_phone_otps (
  id uuid primary key default gen_random_uuid(),
  phone_e164 text not null,
  code_hash text not null,
  expires_at timestamptz not null,
  attempts integer not null default 0 check (attempts >= 0 and attempts <= 5),
  verified_at timestamptz,
  last_sent_at timestamptz not null default now(),
  created_at timestamptz not null default now()
);
create index if not exists seller_phone_otps_phone_created_idx
  on public.seller_phone_otps (phone_e164, created_at desc);
alter table public.seller_phone_otps enable row level security;
revoke all on public.seller_phone_otps from anon, authenticated;
