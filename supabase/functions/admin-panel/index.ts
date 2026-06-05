import { createAdminClient } from '../_shared/admin.ts';
import { handleOptions, jsonResponse } from '../_shared/http.ts';

const cents = (value: unknown) => Math.round(Number(value || 0) * 100);

Deno.serve(async (req) => {
  const optionsResponse = handleOptions(req);
  if (optionsResponse) return optionsResponse;
  if (req.method !== 'POST') return jsonResponse({ error: 'Method not allowed' }, 405);

  try {
    const supabase = createAdminClient();
    const body = await req.json().catch(() => ({}));
    const action = String(body.action || 'load');

    if (action === 'load') {
      const [products, services, stylists, staff, sales, saleItems, settings, policy] = await Promise.all([
        supabase.from('products').select('*').order('name'),
        supabase.from('services').select('*').order('name'),
        supabase.from('stylists').select('*').order('name'),
        supabase.from('staff_profiles').select('*').order('name'),
        supabase.from('pos_sales').select('*').order('created_at', { ascending: false }).limit(500),
        supabase.from('pos_sale_items').select('*').order('created_at', { ascending: false }).limit(1000),
        supabase.from('salon_settings').select('*').eq('id', true).maybeSingle(),
        supabase.from('no_show_policy').select('*').eq('id', true).maybeSingle()
      ]);
      for (const result of [products, services, stylists, staff, sales, saleItems, settings, policy]) {
        if (result.error) throw result.error;
      }
      return jsonResponse({
        products: products.data || [],
        services: services.data || [],
        stylists: stylists.data || [],
        staff: staff.data || [],
        sales: sales.data || [],
        saleItems: saleItems.data || [],
        settings: settings.data,
        policy: policy.data
      });
    }

    if (action === 'upsert_product') {
      const item = body.product || {};
      const payload = {
        id: item.id || undefined,
        name: String(item.name || '').trim(),
        brand: String(item.brand || '').trim(),
        description: String(item.description || '').trim(),
        price_cents: cents(item.price),
        image_url: item.image_url || null,
        tag: item.tag || null,
        stock: Number(item.stock || 0),
        is_active: item.is_active !== false
      };
      const { data, error } = await supabase.from('products').upsert(payload).select('*').single();
      if (error) throw error;
      return jsonResponse({ product: data });
    }

    if (action === 'delete_product') {
      const { error } = await supabase.from('products').update({ is_active: false }).eq('id', body.id);
      if (error) throw error;
      return jsonResponse({ ok: true });
    }

    if (action === 'upsert_service') {
      const item = body.service || {};
      const payload = {
        id: item.id || undefined,
        name: String(item.name || '').trim(),
        description: String(item.description || '').trim(),
        category: String(item.category || 'hair'),
        duration_minutes: Number(item.duration_minutes || item.durationMinutes || 60),
        price_cents: cents(item.price),
        icon_name: item.icon_name || item.iconName || 'Scissors',
        is_active: item.is_active !== false
      };
      const { data, error } = await supabase.from('services').upsert(payload).select('*').single();
      if (error) throw error;
      return jsonResponse({ service: data });
    }

    if (action === 'delete_service') {
      const { error } = await supabase.from('services').update({ is_active: false }).eq('id', body.id);
      if (error) throw error;
      return jsonResponse({ ok: true });
    }

    if (action === 'save_policy') {
      const p = body.policy || {};
      const payload = {
        id: true,
        enabled: p.enabled !== false,
        charge_type: p.charge_type || p.chargeType || 'fixed',
        fixed_cents: cents(p.fixed),
        percentage: Number(p.percentage || 0),
        cancellation_hours: Number(p.cancellation_hours || p.cancellationHours || 24),
        policy_text: String(p.policy_text || p.policyText || '')
      };
      const { data, error } = await supabase.from('no_show_policy').upsert(payload).select('*').single();
      if (error) throw error;
      return jsonResponse({ policy: data });
    }

    if (action === 'save_settings') {
      const s = body.settings || {};
      const payload = {
        id: true,
        salon_name: String(s.salon_name || s.salonName || ''),
        phone: s.phone || null,
        email: s.email || null,
        address: s.address || null,
        opening_hours: s.opening_hours || s.openingHours || null
      };
      const { data, error } = await supabase.from('salon_settings').upsert(payload).select('*').single();
      if (error) throw error;
      return jsonResponse({ settings: data });
    }

    if (action === 'create_sale') {
      const sale = body.sale || {};
      const items = Array.isArray(body.items) ? body.items : [];
      const totalCents = items.reduce((sum: number, item: any) => sum + cents(item.price) * Number(item.quantity || 1), 0);
      const { data: saleData, error: saleError } = await supabase.from('pos_sales').insert({
        appointment_id: sale.appointmentId || null,
        client_name: sale.clientName || null,
        client_email: sale.clientEmail || null,
        payment_method: sale.paymentMethod,
        total_cents: totalCents
      }).select('*').single();
      if (saleError) throw saleError;
      if (items.length) {
        const { error: itemsError } = await supabase.from('pos_sale_items').insert(items.map((item: any) => ({
          sale_id: saleData.id,
          item_type: item.type === 'Producto' ? 'product' : 'service',
          item_id: item.id || null,
          name: item.name,
          quantity: Number(item.quantity || 1),
          unit_price_cents: cents(item.price),
          total_cents: cents(item.price) * Number(item.quantity || 1)
        })));
        if (itemsError) throw itemsError;
      }
      return jsonResponse({ sale: saleData });
    }

    if (action === 'upsert_staff') {
      const staff = body.staff || {};
      let authUserId = staff.auth_user_id || null;
      if (!authUserId && staff.email && staff.password) {
        const created = await supabase.auth.admin.createUser({
          email: staff.email,
          password: staff.password,
          email_confirm: true
        });
        if (created.error) throw created.error;
        authUserId = created.data.user?.id || null;
      }
      const { data, error } = await supabase.from('staff_profiles').upsert({
        id: staff.id || undefined,
        auth_user_id: authUserId,
        name: String(staff.name || '').trim(),
        email: String(staff.email || '').trim(),
        role: staff.role || 'stylist',
        pin: staff.pin || null,
        is_admin: staff.is_admin === true,
        is_active: staff.is_active !== false
      }).select('*').single();
      if (error) throw error;
      return jsonResponse({ staff: data });
    }

    if (action === 'delete_staff') {
      const { error } = await supabase.from('staff_profiles').update({ is_active: false }).eq('id', body.id);
      if (error) throw error;
      return jsonResponse({ ok: true });
    }

    return jsonResponse({ error: 'Accion no soportada.' }, 400);
  } catch (error) {
    return jsonResponse({ error: error instanceof Error ? error.message : 'Admin action failed' }, 500);
  }
});
