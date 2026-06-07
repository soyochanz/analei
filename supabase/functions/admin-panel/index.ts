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
      const [products, services, stylists, staff, sales, saleItems, closures, settings, policy, posts, subscribers] = await Promise.all([
        supabase.from('products').select('*').order('name'),
        supabase.from('services').select('*').order('name'),
        supabase.from('stylists').select('*').order('name'),
        supabase.from('staff_profiles').select('*').order('name'),
        supabase.from('pos_sales').select('*').order('created_at', { ascending: false }).limit(500),
        supabase.from('pos_sale_items').select('*').order('created_at', { ascending: false }).limit(1000),
        supabase.from('cash_register_closures').select('*').order('created_at', { ascending: false }).limit(100),
        supabase.from('salon_settings').select('*').eq('id', true).maybeSingle(),
        supabase.from('no_show_policy').select('*').eq('id', true).maybeSingle(),
        supabase.from('blog_posts').select('*').order('published_date', { ascending: false }).limit(100),
        supabase.from('newsletter_subscribers').select('*').order('created_at', { ascending: false }).limit(1000)
      ]);
      for (const result of [products, services, stylists, staff, sales, saleItems, closures, settings, policy, posts, subscribers]) {
        if (result.error) throw result.error;
      }
      return jsonResponse({
        products: products.data || [],
        services: services.data || [],
        stylists: stylists.data || [],
        staff: staff.data || [],
        sales: sales.data || [],
        saleItems: saleItems.data || [],
        closures: closures.data || [],
        settings: settings.data,
        policy: policy.data,
        posts: posts.data || [],
        subscribers: subscribers.data || []
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
        is_featured: item.is_featured === true || item.isFeatured === true,
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
        opening_hours: s.opening_hours || s.openingHours || null,
        opening_time: s.opening_time || s.openingTime || '09:00',
        closing_time: s.closing_time || s.closingTime || '20:30'
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

    if (action === 'upsert_post') {
      const post = body.post || {};
      const payload = {
        id: post.id || undefined,
        title: String(post.title || '').trim(),
        category: String(post.category || 'Consejos').trim(),
        read_time: String(post.read_time || post.readTime || '3 min').trim(),
        summary: String(post.summary || '').trim(),
        content_html: String(post.content_html || post.contentHtml || ''),
        cover_image_url: post.cover_image_url || post.coverImageUrl || null,
        is_published: post.is_published !== false && post.isPublished !== false,
        published_date: post.published_date || post.publishedDate || new Date().toISOString().slice(0, 10)
      };
      if (!payload.title) return jsonResponse({ error: 'Falta el titulo del post.' }, 400);
      const { data, error } = await supabase.from('blog_posts').upsert(payload).select('*').single();
      if (error) throw error;
      return jsonResponse({ post: data });
    }

    if (action === 'delete_post') {
      const { error } = await supabase.from('blog_posts').delete().eq('id', body.id);
      if (error) throw error;
      return jsonResponse({ ok: true });
    }

    if (action === 'subscribe_newsletter') {
      const email = String(body.email || '').trim().toLowerCase();
      if (!email || !email.includes('@')) return jsonResponse({ error: 'Email no valido.' }, 400);
      const { data, error } = await supabase
        .from('newsletter_subscribers')
        .upsert({ email, source: body.source || 'home' }, { onConflict: 'email' })
        .select('*')
        .single();
      if (error) throw error;
      return jsonResponse({ subscriber: data });
    }

    if (action === 'create_appointment') {
      const appointment = body.appointment || {};
      const serviceId = String(appointment.serviceId || appointment.service_id || '');
      if (!serviceId) return jsonResponse({ error: 'Selecciona un servicio.' }, 400);
      const { data: service, error: serviceError } = await supabase
        .from('services')
        .select('id, name, price_cents')
        .eq('id', serviceId)
        .eq('is_active', true)
        .maybeSingle();
      if (serviceError) throw serviceError;
      if (!service) return jsonResponse({ error: 'Servicio no encontrado.' }, 404);

      const payload = {
        client_name: String(appointment.clientName || appointment.client_name || '').trim(),
        client_email: String(appointment.clientEmail || appointment.client_email || '').trim() || null,
        client_phone: String(appointment.clientPhone || appointment.client_phone || '').trim() || null,
        service_id: service.id,
        service_name: service.name,
        stylist_id: appointment.stylistId || appointment.stylist_id || null,
        appointment_date: String(appointment.date || appointment.appointmentDate || appointment.appointment_date || ''),
        appointment_time: String(appointment.time || appointment.appointmentTime || appointment.appointment_time || ''),
        status: 'Confirmed',
        price_cents: service.price_cents,
        no_show_fee_cents: 0,
        payment_guarantee_status: 'not_required'
      };

      if (!payload.client_name || !payload.appointment_date || !payload.appointment_time) {
        return jsonResponse({ error: 'Faltan nombre, fecha u hora.' }, 400);
      }

      const { data, error } = await supabase.from('appointments').insert(payload).select('*').single();
      if (error) throw error;
      return jsonResponse({ appointment: data });
    }

    if (action === 'update_appointment_status') {
      const appointmentId = String(body.appointmentId || body.appointment_id || '');
      const status = String(body.status || '');
      const allowed = ['Confirmed', 'Pending', 'Cancelled', 'NoShow'];
      if (!appointmentId) return jsonResponse({ error: 'Falta la cita.' }, 400);
      if (!allowed.includes(status)) return jsonResponse({ error: 'Estado no valido.' }, 400);
      const updates: Record<string, unknown> = { status };
      if (status === 'NoShow') {
        updates.payment_guarantee_status = body.paymentGuaranteeStatus || body.payment_guarantee_status || 'not_required';
      }
      const { data, error } = await supabase
        .from('appointments')
        .update(updates)
        .eq('id', appointmentId)
        .select('*')
        .single();
      if (error) throw error;
      return jsonResponse({ appointment: data });
    }

    if (action === 'close_register') {
      const method = body.method || 'all';
      const now = new Date();
      const lastClosure = await supabase
        .from('cash_register_closures')
        .select('*')
        .eq('method', method)
        .order('to_at', { ascending: false })
        .limit(1)
        .maybeSingle();
      if (lastClosure.error) throw lastClosure.error;
      const fromAt = lastClosure.data?.to_at || new Date(0).toISOString();
      let query = supabase.from('pos_sales').select('*').gt('created_at', fromAt).lte('created_at', now.toISOString());
      if (method !== 'all') query = query.eq('payment_method', method);
      const salesResult = await query.order('created_at', { ascending: true });
      if (salesResult.error) throw salesResult.error;
      const selectedSales = salesResult.data || [];
      const totalCents = selectedSales.reduce((sum: number, sale: any) => sum + Number(sale.total_cents || 0), 0);
      const closure = await supabase.from('cash_register_closures').insert({
        method,
        from_at: fromAt,
        to_at: now.toISOString(),
        total_cents: totalCents,
        sale_count: selectedSales.length
      }).select('*').single();
      if (closure.error) throw closure.error;
      return jsonResponse({ closure: closure.data, sales: selectedSales });
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
      const stylistResult = await supabase.from('stylists').upsert({
        id: staff.stylist_id || undefined,
        name: String(staff.name || '').trim(),
        role: staff.role || 'stylist',
        is_active: staff.is_active !== false
      }).select('*').single();
      if (stylistResult.error) throw stylistResult.error;

      const { data, error } = await supabase.from('staff_profiles').upsert({
        id: staff.id || undefined,
        auth_user_id: authUserId,
        stylist_id: stylistResult.data.id,
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
