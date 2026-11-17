create table if not exists public.support_messages (
  id uuid primary key default gen_random_uuid(),
  seller_id uuid not null references public.profiles(id) on delete cascade,
  sender_id uuid not null references public.profiles(id) on delete cascade,
  body text not null check (char_length(body) between 1 and 5000),
  read_at timestamptz,
  created_at timestamptz not null default now()
);

create index if not exists support_messages_seller_created_idx
  on public.support_messages(seller_id, created_at);

alter table public.support_messages enable row level security;
grant select, insert, update on public.support_messages to authenticated;

drop policy if exists "support messages visible to thread members" on public.support_messages;
create policy "support messages visible to thread members"
on public.support_messages for select to authenticated
using (seller_id = auth.uid() or public.is_admin());

drop policy if exists "seller or admin send support messages" on public.support_messages;
create policy "seller or admin send support messages"
on public.support_messages for insert to authenticated
with check (
  sender_id = auth.uid()
  and (
    (seller_id = auth.uid() and exists (
      select 1 from public.profiles p where p.id = auth.uid() and p.role = 'seller'
    ))
    or
    (public.is_admin() and exists (
      select 1 from public.profiles p where p.id = seller_id and p.role = 'seller'
    ))
  )
);

drop policy if exists "thread recipient marks messages read" on public.support_messages;
create policy "thread recipient marks messages read"
on public.support_messages for update to authenticated
using (
  (seller_id = auth.uid() and sender_id <> auth.uid())
  or (public.is_admin() and sender_id = seller_id)
)
with check (read_at is not null);
