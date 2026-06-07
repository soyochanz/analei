create table if not exists public.client_profiles (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  email text,
  phone text,
  photo_url text,
  notes text,
  birthdate date,
  allergies text,
  preferences text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create unique index if not exists client_profiles_email_unique
on public.client_profiles (lower(email))
where email is not null and email <> '';

create index if not exists client_profiles_search_idx
on public.client_profiles using gin (
  to_tsvector('simple', coalesce(name, '') || ' ' || coalesce(email, '') || ' ' || coalesce(phone, ''))
);

drop trigger if exists set_client_profiles_updated_at on public.client_profiles;
create trigger set_client_profiles_updated_at
before update on public.client_profiles
for each row execute function public.set_updated_at();

create table if not exists public.newsletter_campaigns (
  id uuid primary key default gen_random_uuid(),
  subject text not null,
  template text not null default 'custom',
  body_html text not null,
  status text not null default 'draft' check (status in ('draft', 'sent', 'failed')),
  recipient_count integer not null default 0,
  sent_at timestamptz,
  error_message text,
  created_at timestamptz not null default now()
);

alter table public.client_profiles enable row level security;
alter table public.newsletter_campaigns enable row level security;

drop policy if exists "No direct client profile access" on public.client_profiles;
create policy "No direct client profile access"
on public.client_profiles for select
using (false);

drop policy if exists "No direct newsletter campaign access" on public.newsletter_campaigns;
create policy "No direct newsletter campaign access"
on public.newsletter_campaigns for select
using (false);
