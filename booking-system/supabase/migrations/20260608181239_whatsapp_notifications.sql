create table if not exists public.whatsapp_notifications (
  id uuid primary key default gen_random_uuid(),
  appointment_id uuid references public.appointments(id) on delete cascade,
  notification_type text not null check (notification_type in ('confirmation', 'reminder_2h')),
  phone text not null,
  status text not null default 'pending' check (status in ('pending', 'sent', 'failed', 'skipped')),
  provider_message_id text,
  error_message text,
  sent_at timestamptz,
  created_at timestamptz not null default now()
);

create unique index if not exists whatsapp_notifications_once_idx
on public.whatsapp_notifications (appointment_id, notification_type);

create index if not exists whatsapp_notifications_status_idx
on public.whatsapp_notifications (status, notification_type);

alter table public.whatsapp_notifications enable row level security;

drop policy if exists "No direct whatsapp notification access" on public.whatsapp_notifications;
create policy "No direct whatsapp notification access"
on public.whatsapp_notifications for select
using (false);

create extension if not exists pg_cron with schema extensions;
create extension if not exists pg_net with schema extensions;

do $$
begin
  perform cron.unschedule('send-whatsapp-reminders-every-10-minutes');
exception
  when others then null;
end $$;

select cron.schedule(
  'send-whatsapp-reminders-every-10-minutes',
  '*/10 * * * *',
  $$
  select net.http_post(
    url := 'https://zuhiuvreazpkpwkealfm.supabase.co/functions/v1/send-whatsapp-reminders',
    headers := '{"Content-Type":"application/json"}'::jsonb,
    body := '{}'::jsonb
  );
  $$
);
