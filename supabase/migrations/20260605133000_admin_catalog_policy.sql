create table if not exists public.products (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  brand text not null default '',
  description text not null default '',
  price_cents integer not null default 0,
  image_url text,
  tag text,
  stock integer not null default 0,
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.salon_settings (
  id boolean primary key default true,
  salon_name text not null default 'Peluqueria Maria y Estetica',
  phone text,
  email text,
  address text,
  opening_hours text,
  updated_at timestamptz not null default now(),
  constraint salon_settings_singleton check (id)
);

create table if not exists public.no_show_policy (
  id boolean primary key default true,
  enabled boolean not null default true,
  charge_type text not null default 'fixed' check (charge_type in ('fixed', 'percentage')),
  fixed_cents integer not null default 4000,
  percentage integer not null default 50 check (percentage >= 0 and percentage <= 100),
  cancellation_hours integer not null default 24,
  policy_text text not null default 'Si no asistes o cancelas fuera de plazo, se cobrara la penalizacion autorizada al reservar.',
  updated_at timestamptz not null default now(),
  constraint no_show_policy_singleton check (id)
);

drop trigger if exists set_products_updated_at on public.products;
create trigger set_products_updated_at
before update on public.products
for each row execute function public.set_updated_at();

drop trigger if exists set_salon_settings_updated_at on public.salon_settings;
create trigger set_salon_settings_updated_at
before update on public.salon_settings
for each row execute function public.set_updated_at();

drop trigger if exists set_no_show_policy_updated_at on public.no_show_policy;
create trigger set_no_show_policy_updated_at
before update on public.no_show_policy
for each row execute function public.set_updated_at();

alter table public.products enable row level security;
alter table public.salon_settings enable row level security;
alter table public.no_show_policy enable row level security;

drop policy if exists "Public can read active products" on public.products;
create policy "Public can read active products"
on public.products for select
to anon, authenticated
using (is_active = true);

drop policy if exists "Public can read salon settings" on public.salon_settings;
create policy "Public can read salon settings"
on public.salon_settings for select
to anon, authenticated
using (true);

drop policy if exists "Public can read no show policy" on public.no_show_policy;
create policy "Public can read no show policy"
on public.no_show_policy for select
to anon, authenticated
using (true);

insert into public.salon_settings (id, salon_name, email)
values (true, 'Peluqueria Maria y Estetica', 'soporte@peluqueriamaria.com')
on conflict (id) do nothing;

insert into public.no_show_policy (id)
values (true)
on conflict (id) do nothing;

insert into public.products (name, brand, description, price_cents, image_url, tag, stock)
values
  ('PhytoRx Combo Regenerador e Iluminador', 'Lotus Professional', 'Formula avanzada para restaurar luminosidad y purificar la dermis.', 4999, 'https://images.unsplash.com/photo-1601049541289-9b1b7bbbfe19?q=80&w=600&auto=format&fit=crop', 'RECOMENDADO', 12),
  ('Limpiador Botanico Hidratante de Rosa Organica', 'Aura & Bloom', 'Espuma facial extrasuave enriquecida con rosa organica.', 2450, 'https://images.unsplash.com/photo-1556228720-195a672e8a03?q=80&w=600&auto=format&fit=crop', 'FORMULA ECO', 18),
  ('Serum Antioxidante Elasticidad Avanzada', 'Mary Care', 'Tratamiento corrector con Vitamina C y acido hialuronico.', 3800, 'https://images.unsplash.com/photo-1608248597481-496100c8c836?q=80&w=600&auto=format&fit=crop', 'ALTA COSMETICA', 9)
on conflict do nothing;
