alter table public.salons
add column if not exists brand_color text not null default '#da4d73';

update public.salons
set brand_color = '#da4d73'
where brand_color is null or brand_color = '';
