create table if not exists public.staff_profiles (
  id uuid primary key default gen_random_uuid(),
  auth_user_id uuid unique,
  name text not null,
  email text not null unique,
  role text not null default 'stylist',
  pin text,
  is_admin boolean not null default false,
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.pos_sales (
  id uuid primary key default gen_random_uuid(),
  appointment_id uuid references public.appointments(id) on delete set null,
  client_name text,
  client_email text,
  payment_method text not null check (payment_method in ('cash', 'card')),
  total_cents integer not null default 0,
  created_by uuid,
  created_at timestamptz not null default now()
);

create table if not exists public.pos_sale_items (
  id uuid primary key default gen_random_uuid(),
  sale_id uuid not null references public.pos_sales(id) on delete cascade,
  item_type text not null check (item_type in ('service', 'product')),
  item_id uuid,
  name text not null,
  quantity integer not null default 1,
  unit_price_cents integer not null default 0,
  total_cents integer not null default 0,
  created_at timestamptz not null default now()
);

drop trigger if exists set_staff_profiles_updated_at on public.staff_profiles;
create trigger set_staff_profiles_updated_at
before update on public.staff_profiles
for each row execute function public.set_updated_at();

alter table public.staff_profiles enable row level security;
alter table public.pos_sales enable row level security;
alter table public.pos_sale_items enable row level security;

drop policy if exists "Authenticated can read staff profiles" on public.staff_profiles;
create policy "Authenticated can read staff profiles"
on public.staff_profiles for select
to authenticated
using (true);

-- Writes for POS and staff are performed through Edge Functions with service role.
