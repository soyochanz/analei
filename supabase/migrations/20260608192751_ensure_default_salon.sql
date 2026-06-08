insert into public.salons (name, slug, email, is_active)
values ('Peluqueria Maria', 'peluqueria-maria', 'soporte@peluqueriamaria.com', true)
on conflict (slug) do update set is_active = true;

do $$
declare
  default_salon uuid;
begin
  select id into default_salon from public.salons where slug = 'peluqueria-maria' limit 1;

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

  insert into public.salon_settings (id, salon_id, salon_name, email, opening_time, closing_time)
  select true, default_salon, 'Peluqueria Maria y Estetica', 'soporte@peluqueriamaria.com', '09:00', '20:30'
  where not exists (select 1 from public.salon_settings where salon_id = default_salon);

  insert into public.no_show_policy (id, salon_id, enabled, charge_type, fixed_cents, percentage, cancellation_hours)
  select true, default_salon, true, 'fixed', 4000, 50, 24
  where not exists (select 1 from public.no_show_policy where salon_id = default_salon);
end $$;
