-- Customer self-service support tickets and private conversation threads.
create table if not exists public.support_tickets (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  reference_code text not null unique default (
    'MB-' || to_char(now() at time zone 'Africa/Dar_es_Salaam', 'YYYYMMDD') || '-' ||
    upper(substr(replace(gen_random_uuid()::text, '-', ''), 1, 6))
  ),
  category text not null check (category in ('payment','book_access','book_quality','account','other')),
  subject text not null check (char_length(subject) between 3 and 120),
  status text not null default 'received' check (status in ('received','in_progress','resolved')),
  sms_notifications_consented boolean not null default false,
  sms_notifications_consented_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.support_ticket_messages (
  id uuid primary key default gen_random_uuid(),
  ticket_id uuid not null references public.support_tickets(id) on delete cascade,
  sender_id uuid not null references public.profiles(id) on delete cascade,
  body text not null check (char_length(body) between 1 and 5000),
  created_at timestamptz not null default now()
);

create index if not exists support_tickets_user_created_idx
  on public.support_tickets(user_id, created_at desc);
create index if not exists support_tickets_status_created_idx
  on public.support_tickets(status, created_at desc);
create index if not exists support_ticket_messages_ticket_created_idx
  on public.support_ticket_messages(ticket_id, created_at);

alter table public.support_tickets enable row level security;
alter table public.support_ticket_messages enable row level security;

grant select, insert on public.support_tickets to authenticated;
grant select, insert on public.support_ticket_messages to authenticated;
grant update (status, updated_at) on public.support_tickets to authenticated;

drop policy if exists "customers read own tickets and admins read all" on public.support_tickets;
create policy "customers read own tickets and admins read all"
on public.support_tickets for select to authenticated
using (user_id = auth.uid() or private.is_admin());

drop policy if exists "buyers create own support tickets" on public.support_tickets;
create policy "buyers create own support tickets"
on public.support_tickets for insert to authenticated
with check (
  user_id = auth.uid()
  and exists (select 1 from public.profiles p where p.id = auth.uid() and p.role = 'buyer')
);

drop policy if exists "admins update support ticket status" on public.support_tickets;
create policy "admins update support ticket status"
on public.support_tickets for update to authenticated
using (private.is_admin())
with check (private.is_admin());

drop policy if exists "ticket members read messages" on public.support_ticket_messages;
create policy "ticket members read messages"
on public.support_ticket_messages for select to authenticated
using (
  private.is_admin()
  or exists (
    select 1 from public.support_tickets t
    where t.id = ticket_id and t.user_id = auth.uid()
  )
);

drop policy if exists "ticket owner or admin send messages" on public.support_ticket_messages;
create policy "ticket owner or admin send messages"
on public.support_ticket_messages for insert to authenticated
with check (
  sender_id = auth.uid()
  and (
    private.is_admin()
    or exists (
      select 1 from public.support_tickets t
      join public.profiles p on p.id = t.user_id
      where t.id = ticket_id and t.user_id = auth.uid() and p.role = 'buyer' and t.status <> 'resolved'
    )
  )
);

create or replace function public.touch_support_ticket_updated_at()
returns trigger language plpgsql set search_path = public
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists support_tickets_touch_updated_at on public.support_tickets;
create trigger support_tickets_touch_updated_at
before update on public.support_tickets
for each row execute function public.touch_support_ticket_updated_at();
