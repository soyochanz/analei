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
      const [products, services, stylists, settings, policy] = await Promise.all([
        supabase.from('products').select('*').order('name'),
        supabase.from('services').select('*').order('name'),
        supabase.from('stylists').select('*').order('name'),
        supabase.from('salon_settings').select('*').eq('id', true).maybeSingle(),
        supabase.from('no_show_policy').select('*').eq('id', true).maybeSingle()
      ]);
      for (const result of [products, services, stylists, settings, policy]) {
        if (result.error) throw result.error;
      }
      return jsonResponse({
        products: products.data || [],
        services: services.data || [],
        stylists: stylists.data || [],
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

    return jsonResponse({ error: 'Accion no soportada.' }, 400);
  } catch (error) {
    return jsonResponse({ error: error instanceof Error ? error.message : 'Admin action failed' }, 500);
  }
});
