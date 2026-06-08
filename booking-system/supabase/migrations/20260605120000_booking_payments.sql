create extension if not exists pgcrypto;

create table if not exists public.stylists (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  role text not null default 'Peluquera',
  bio text,
  avatar_url text,
  is_active boolean not null default true,
  created_at timestamptz not null default now()
);

create table if not exists public.services (
  id uuid primary key default gen_random_uuid(),
  legacy_id text unique,
  name text not null unique,
  description text,
  category text not null,
  duration_minutes integer not null default 60,
  price_cents integer not null,
  icon_name text,
  is_active boolean not null default true,
  created_at timestamptz not null default now()
);

create table if not exists public.appointments (
  id uuid primary key default gen_random_uuid(),
  client_name text not null,
  client_email text not null,
  client_phone text,
  service_id uuid references public.services(id) on delete set null,
  service_name text not null,
  stylist_id uuid references public.stylists(id) on delete set null,
  appointment_date date not null,
  appointment_time text not null,
  status text not null default 'Pending' check (status in ('Pending', 'Confirmed', 'Cancelled', 'NoShow')),
  price_cents integer not null,
  no_show_fee_cents integer not null default 4000,
  stripe_customer_id text,
  stripe_payment_method_id text,
  stripe_setup_intent_id text unique,
  payment_guarantee_status text not null default 'secured' check (payment_guarantee_status in ('secured', 'not_required', 'charged', 'charge_failed')),
  no_show_charge_id text,
  notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists appointments_date_idx on public.appointments (appointment_date);
create index if not exists appointments_status_idx on public.appointments (status);
create index if not exists appointments_service_id_idx on public.appointments (service_id);
create index if not exists appointments_stylist_id_idx on public.appointments (stylist_id);

create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists set_appointments_updated_at on public.appointments;
create trigger set_appointments_updated_at
before update on public.appointments
for each row execute function public.set_updated_at();

alter table public.stylists enable row level security;
alter table public.services enable row level security;
alter table public.appointments enable row level security;

drop policy if exists "Public can read active stylists" on public.stylists;
create policy "Public can read active stylists"
on public.stylists for select
to anon, authenticated
using (is_active = true);

drop policy if exists "Public can read active services" on public.services;
create policy "Public can read active services"
on public.services for select
to anon, authenticated
using (is_active = true);

-- Appointment writes happen through Edge Functions using the service role.
-- The public client does not get direct read/write access to customer bookings.

insert into public.stylists (name, role, bio)
values
  ('Maria', 'Directora tecnica', 'Especialista en color, corte y tratamientos capilares.'),
  ('Wendy', 'Estilista senior', 'Especialista en balayage, manicura y rituales beauty.')
on conflict do nothing;

insert into public.services (legacy_id, name, description, category, duration_minutes, price_cents, icon_name)
values
  ('s1', 'Balayage y Corte Luxury', 'Tecnica personalizada de balayage organico pintado a mano con tratamiento de lavado, mascarilla regeneradora y corte profesional.', 'hair', 150, 13500, 'Scissors'),
  ('s2', 'Higiene Facial Profunda', 'Tratamiento de extraccion profunda de impurezas y nutricion botanica para restaurar elasticidad y luminosidad.', 'facials', 60, 6500, 'Sparkles'),
  ('s3', 'Manicura Spa de Lavanda', 'Tratamiento hidratante de unas botanico, exfoliacion, masaje de manos y acabado en gel.', 'nails', 45, 3500, 'Heart'),
  ('s4', 'Retoque de Color Organico', 'Revision y cobertura de color en raiz con pigmentos organicos sin amoniaco.', 'hair', 90, 5500, 'Scissors'),
  ('s5', 'Terapia de Hidratacion Profunda', 'Mascarilla capilar revitalizante de queratina y aceite de argan con microbruma templada.', 'hair', 45, 4500, 'Droplet'),
  ('s6', 'Masaje Facial por Acupresion', 'Reflexologia facial para liberacion de tensiones, drenaje y definicion del ovalo facial.', 'facials', 30, 4000, 'Smile'),
  ('s7', 'Pedicura Deluxe con Piedras Calientes', 'Ritual relajante con sales marinas, exfoliacion natural, piedras calientes y cuidado de unas.', 'nails', 60, 4500, 'Sparkles'),
  ('s8', 'Sesion de Bienestar de Lavanda', 'Masaje corporal relajante integral con aceites templados de lavanda.', 'wellness', 90, 8500, 'Flame')
on conflict (legacy_id) do update set
  name = excluded.name,
  description = excluded.description,
  category = excluded.category,
  duration_minutes = excluded.duration_minutes,
  price_cents = excluded.price_cents,
  icon_name = excluded.icon_name,
  is_active = true;
