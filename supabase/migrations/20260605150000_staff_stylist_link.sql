alter table public.staff_profiles
add column if not exists stylist_id uuid references public.stylists(id) on delete set null;

create index if not exists staff_profiles_stylist_id_idx on public.staff_profiles(stylist_id);
