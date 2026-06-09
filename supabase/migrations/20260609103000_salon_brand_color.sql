alter table public.salons
add column if not exists brand_color text not null default '#2f8f83';

update public.salons
set brand_color = '#2f8f83'
where brand_color is null or brand_color = '';
