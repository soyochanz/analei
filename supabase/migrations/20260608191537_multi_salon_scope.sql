create table if not exists public.salons (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  slug text not null unique,
  address text,
  phone text,
  email text,
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

drop trigger if exists set_salons_updated_at on public.salons;
create trigger set_salons_updated_at
before update on public.salons
for each row execute function public.set_updated_at();

insert into public.salons (name, slug, email)
values ('Analei', 'analei', 'soporte@analei.es')
on conflict (slug) do nothing;

alter table public.products add column if not exists salon_id uuid references public.salons(id) on delete cascade;
alter table public.services add column if not exists salon_id uuid references public.salons(id) on delete cascade;
alter table public.stylists add column if not exists salon_id uuid references public.salons(id) on delete cascade;
alter table public.appointments add column if not exists salon_id uuid references public.salons(id) on delete cascade;
alter table public.salon_settings add column if not exists salon_id uuid references public.salons(id) on delete cascade;
alter table public.no_show_policy add column if not exists salon_id uuid references public.salons(id) on delete cascade;
alter table public.staff_profiles add column if not exists salon_id uuid references public.salons(id) on delete cascade;
alter table public.pos_sales add column if not exists salon_id uuid references public.salons(id) on delete cascade;
alter table public.pos_sale_items add column if not exists salon_id uuid references public.salons(id) on delete cascade;
alter table public.cash_register_closures add column if not exists salon_id uuid references public.salons(id) on delete cascade;
alter table public.blog_posts add column if not exists salon_id uuid references public.salons(id) on delete cascade;
alter table public.newsletter_subscribers add column if not exists salon_id uuid references public.salons(id) on delete cascade;
alter table public.client_profiles add column if not exists salon_id uuid references public.salons(id) on delete cascade;
alter table public.newsletter_campaigns add column if not exists salon_id uuid references public.salons(id) on delete cascade;
alter table public.whatsapp_notifications add column if not exists salon_id uuid references public.salons(id) on delete cascade;

alter table public.salon_settings drop constraint if exists salon_settings_singleton;
alter table public.salon_settings drop constraint if exists salon_settings_pkey;
alter table public.no_show_policy drop constraint if exists no_show_policy_singleton;
alter table public.no_show_policy drop constraint if exists no_show_policy_pkey;

do $$
declare
  default_salon uuid;
begin
  select id into default_salon from public.salons where slug = 'analei' limit 1;

  update public.products set salon_id = default_salon where salon_id is null;
  update public.services set salon_id = default_salon where salon_id is null;
  update public.stylists set salon_id = default_salon where salon_id is null;
  update public.appointments set salon_id = default_salon where salon_id is null;
  update public.salon_settings set salon_id = default_salon where salon_id is null;
  update public.no_show_policy set salon_id = default_salon where salon_id is null;
  update public.staff_profiles set salon_id = default_salon where salon_id is null;
  update public.pos_sales set salon_id = default_salon where salon_id is null;
  update public.pos_sale_items set salon_id = default_salon where salon_id is null;
  update public.cash_register_closures set salon_id = default_salon where salon_id is null;
  update public.blog_posts set salon_id = default_salon where salon_id is null;
  update public.newsletter_subscribers set salon_id = default_salon where salon_id is null;
  update public.client_profiles set salon_id = default_salon where salon_id is null;
  update public.newsletter_campaigns set salon_id = default_salon where salon_id is null;
  update public.whatsapp_notifications set salon_id = default_salon where salon_id is null;
end $$;

create index if not exists products_salon_id_idx on public.products(salon_id);
create index if not exists services_salon_id_idx on public.services(salon_id);
create index if not exists stylists_salon_id_idx on public.stylists(salon_id);
create index if not exists appointments_salon_id_idx on public.appointments(salon_id);
create index if not exists staff_profiles_salon_id_idx on public.staff_profiles(salon_id);
create index if not exists pos_sales_salon_id_idx on public.pos_sales(salon_id);
create index if not exists blog_posts_salon_id_idx on public.blog_posts(salon_id);
create index if not exists client_profiles_salon_id_idx on public.client_profiles(salon_id);
create unique index if not exists salon_settings_salon_id_unique on public.salon_settings(salon_id);
create unique index if not exists no_show_policy_salon_id_unique on public.no_show_policy(salon_id);

alter table public.newsletter_subscribers drop constraint if exists newsletter_subscribers_email_key;
drop index if exists client_profiles_email_unique;
create unique index if not exists newsletter_subscribers_salon_email_unique
on public.newsletter_subscribers (salon_id, lower(email));
create unique index if not exists client_profiles_salon_email_unique
on public.client_profiles (salon_id, lower(email))
where email is not null and email <> '';

alter table public.salons enable row level security;

drop policy if exists "Public can read active salons" on public.salons;
create policy "Public can read active salons"
on public.salons for select
using (is_active = true);
