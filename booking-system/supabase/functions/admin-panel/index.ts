import { createAdminClient } from '../_shared/admin.ts';
import { handleOptions, jsonResponse } from '../_shared/http.ts';
import { sendAppointmentWhatsApp } from '../_shared/whatsapp.ts';

const cents = (value: unknown) => Math.round(Number(value || 0) * 100);
const asText = (value: unknown) => String(value || '').trim();
const slugify = (value: string) =>
  value.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '') || `salon-${Date.now()}`;
const normalizeColor = (value: unknown) => {
  const color = asText(value);
  return /^#[0-9a-fA-F]{6}$/.test(color) ? color : '#da4d73';
};

Deno.serve(async (req) => {
  const optionsResponse = handleOptions(req);
  if (optionsResponse) return optionsResponse;
  if (req.method !== 'POST') return jsonResponse({ error: 'Method not allowed' }, 405);

  try {
    const supabase = createAdminClient();
    const body = await req.json().catch(() => ({}));
    const action = String(body.action || 'load');
    const getSalonId = async () => {
      const requested = asText(body.salonId || body.salon_id);
      if (requested) return requested;
      const { data, error } = await supabase.from('salons').select('id').eq('is_active', true).order('created_at').limit(1).maybeSingle();
      if (error) throw error;
      return data?.id || null;
    };

    if (action === 'load') {
      const salonId = await getSalonId();
      const salons = await supabase.from('salons').select('*').eq('is_active', true).order('name');
      if (salons.error) throw salons.error;
      const [products, services, stylists, staff, sales, saleItems, closures, settings, policy, posts, subscribers, clients, campaigns] = await Promise.all([
        supabase.from('products').select('*').eq('salon_id', salonId).order('name'),
        supabase.from('services').select('*').eq('salon_id', salonId).order('name'),
        supabase.from('stylists').select('*').eq('salon_id', salonId).order('name'),
        supabase.from('staff_profiles').select('*').eq('salon_id', salonId).order('name'),
        supabase.from('pos_sales').select('*').eq('salon_id', salonId).order('created_at', { ascending: false }).limit(500),
        supabase.from('pos_sale_items').select('*').eq('salon_id', salonId).order('created_at', { ascending: false }).limit(1000),
        supabase.from('cash_register_closures').select('*').eq('salon_id', salonId).order('created_at', { ascending: false }).limit(100),
        supabase.from('salon_settings').select('*').eq('salon_id', salonId).maybeSingle(),
        supabase.from('no_show_policy').select('*').eq('salon_id', salonId).maybeSingle(),
        supabase.from('blog_posts').select('*').eq('salon_id', salonId).order('published_date', { ascending: false }).limit(100),
        supabase.from('newsletter_subscribers').select('*').eq('salon_id', salonId).order('created_at', { ascending: false }).limit(1000),
        supabase.from('client_profiles').select('*').eq('salon_id', salonId).order('name').limit(1000),
        supabase.from('newsletter_campaigns').select('*').eq('salon_id', salonId).order('created_at', { ascending: false }).limit(100)
      ]);
      for (const result of [products, services, stylists, staff, sales, saleItems, closures, settings, policy, posts, subscribers, clients, campaigns]) {
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
        subscribers: subscribers.data || [],
        clients: clients.data || [],
        campaigns: campaigns.data || [],
        salons: salons.data || [],
        selectedSalonId: salonId
      });
    }

    if (action === 'create_salon') {
      const salon = body.salon || {};
      const name = asText(salon.name);
      if (!name) return jsonResponse({ error: 'Falta el nombre del salon.' }, 400);
      const payload = {
        name,
        slug: asText(salon.slug) || slugify(name),
        address: asText(salon.address) || null,
        phone: asText(salon.phone) || null,
        email: asText(salon.email) || null,
        brand_color: normalizeColor(salon.brand_color || salon.brandColor),
        is_active: true
      };
      const { data, error } = await supabase.from('salons').insert(payload).select('*').single();
      if (error) throw error;
      await supabase.from('salon_settings').insert({ id: true, salon_id: data.id, salon_name: data.name, phone: data.phone, email: data.email, address: data.address, opening_time: '09:00', closing_time: '20:30' });
      await supabase.from('no_show_policy').insert({ id: true, salon_id: data.id, enabled: true, charge_type: 'fixed', fixed_cents: 4000, percentage: 50, cancellation_hours: 24 });
      return jsonResponse({ salon: data });
    }

    if (action === 'update_salon') {
      const salon = body.salon || {};
      const id = asText(salon.id || body.salonId || body.salon_id);
      const name = asText(salon.name);
      if (!id) return jsonResponse({ error: 'Falta el salon.' }, 400);
      if (!name) return jsonResponse({ error: 'Falta el nombre del salon.' }, 400);
      const payload = {
        name,
        slug: asText(salon.slug) || slugify(name),
        address: asText(salon.address) || null,
        phone: asText(salon.phone) || null,
        email: asText(salon.email) || null,
        brand_color: normalizeColor(salon.brand_color || salon.brandColor)
      };
      const { data, error } = await supabase.from('salons').update(payload).eq('id', id).select('*').single();
      if (error) throw error;
      await supabase.from('salon_settings').upsert({
        id: true,
        salon_id: data.id,
        salon_name: data.name,
        phone: data.phone,
        email: data.email,
        address: data.address
      }, { onConflict: 'salon_id' });
      return jsonResponse({ salon: data });
    }

    if (action === 'delete_salon') {
      const id = asText(body.salonId || body.salon_id || body.id);
      if (!id) return jsonResponse({ error: 'Falta el salon.' }, 400);
      const { count, error: countError } = await supabase
        .from('salons')
        .select('id', { count: 'exact', head: true })
        .eq('is_active', true);
      if (countError) throw countError;
      if ((count || 0) <= 1) return jsonResponse({ error: 'No puedes eliminar el ultimo salon activo.' }, 400);
      const { error } = await supabase.from('salons').update({ is_active: false }).eq('id', id);
      if (error) throw error;
      const next = await supabase.from('salons').select('id').eq('is_active', true).neq('id', id).order('created_at').limit(1).maybeSingle();
      if (next.error) throw next.error;
      return jsonResponse({ ok: true, selectedSalonId: next.data?.id || null });
    }

    if (action === 'upsert_product') {
      const salonId = await getSalonId();
      const item = body.product || {};
      const payload = {
        id: item.id || undefined,
        salon_id: salonId,
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
      const salonId = await getSalonId();
      const item = body.service || {};
      const payload = {
        id: item.id || undefined,
        salon_id: salonId,
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
      const salonId = await getSalonId();
      const p = body.policy || {};
      const payload = {
        id: true,
        salon_id: salonId,
        enabled: p.enabled !== false,
        charge_type: p.charge_type || p.chargeType || 'fixed',
        fixed_cents: cents(p.fixed),
        percentage: Number(p.percentage || 0),
        cancellation_hours: Number(p.cancellation_hours || p.cancellationHours || 24),
        policy_text: String(p.policy_text || p.policyText || '')
      };
      const { data, error } = await supabase.from('no_show_policy').upsert(payload, { onConflict: 'salon_id' }).select('*').single();
      if (error) throw error;
      return jsonResponse({ policy: data });
    }

    if (action === 'save_settings') {
      const salonId = await getSalonId();
      const s = body.settings || {};
      const payload = {
        id: true,
        salon_id: salonId,
        salon_name: String(s.salon_name || s.salonName || ''),
        phone: s.phone || null,
        email: s.email || null,
        address: s.address || null,
        opening_hours: s.opening_hours || s.openingHours || null,
        opening_time: s.opening_time || s.openingTime || '09:00',
        closing_time: s.closing_time || s.closingTime || '20:30'
      };
      const { data, error } = await supabase.from('salon_settings').upsert(payload, { onConflict: 'salon_id' }).select('*').single();
      if (error) throw error;
      return jsonResponse({ settings: data });
    }

    if (action === 'create_sale') {
      const salonId = await getSalonId();
      const sale = body.sale || {};
      const items = Array.isArray(body.items) ? body.items : [];
      const totalCents = items.reduce((sum: number, item: any) => sum + cents(item.price) * Number(item.quantity || 1), 0);
      const { data: saleData, error: saleError } = await supabase.from('pos_sales').insert({
        salon_id: salonId,
        appointment_id: sale.appointmentId || null,
        client_name: sale.clientName || null,
        client_email: sale.clientEmail || null,
        payment_method: sale.paymentMethod,
        total_cents: totalCents
      }).select('*').single();
      if (saleError) throw saleError;
      if (items.length) {
        const { error: itemsError } = await supabase.from('pos_sale_items').insert(items.map((item: any) => ({
          salon_id: salonId,
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
      const salonId = await getSalonId();
      const post = body.post || {};
      const payload = {
        id: post.id || undefined,
        salon_id: salonId,
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
      const salonId = await getSalonId();
      const email = String(body.email || '').trim().toLowerCase();
      if (!email || !email.includes('@')) return jsonResponse({ error: 'Email no valido.' }, 400);
      const existing = await supabase.from('newsletter_subscribers').select('id').eq('salon_id', salonId).eq('email', email).maybeSingle();
      if (existing.error) throw existing.error;
      const result = existing.data?.id
        ? await supabase.from('newsletter_subscribers').update({ source: body.source || 'home' }).eq('id', existing.data.id).select('*').single()
        : await supabase.from('newsletter_subscribers').insert({ email, source: body.source || 'home', salon_id: salonId }).select('*').single();
      const { data, error } = result;
      if (error) throw error;
      return jsonResponse({ subscriber: data });
    }

    if (action === 'upsert_client') {
      const salonId = await getSalonId();
      const client = body.client || {};
      const payload = {
        id: client.id || undefined,
        salon_id: salonId,
        name: asText(client.name),
        email: asText(client.email).toLowerCase() || null,
        phone: asText(client.phone) || null,
        photo_url: asText(client.photo_url || client.photoUrl) || null,
        notes: asText(client.notes) || null,
        birthdate: asText(client.birthdate) || null,
        allergies: asText(client.allergies) || null,
        preferences: asText(client.preferences) || null
      };
      if (!payload.name) return jsonResponse({ error: 'Falta el nombre del cliente.' }, 400);
      const { data, error } = await supabase.from('client_profiles').upsert(payload).select('*').single();
      if (error) throw error;
      return jsonResponse({ client: data });
    }

    if (action === 'delete_client') {
      const { error } = await supabase.from('client_profiles').delete().eq('id', body.id);
      if (error) throw error;
      return jsonResponse({ ok: true });
    }

    if (action === 'send_newsletter') {
      const salonId = await getSalonId();
      const subject = asText(body.subject);
      const template = asText(body.template) || 'custom';
      const bodyHtml = asText(body.body_html || body.bodyHtml);
      if (!subject || !bodyHtml) return jsonResponse({ error: 'Faltan asunto o contenido.' }, 400);

      const { data: subscribers, error: subscribersError } = await supabase
        .from('newsletter_subscribers')
        .select('email')
        .eq('salon_id', salonId)
        .order('created_at', { ascending: false });
      if (subscribersError) throw subscribersError;
      const recipients = [...new Set((subscribers || []).map((s: { email: string }) => s.email).filter(Boolean))];
      if (!recipients.length) return jsonResponse({ error: 'No hay emails en el newsletter.' }, 400);

      const resendKey = Deno.env.get('RESEND_API_KEY');
      const fromEmail = Deno.env.get('NEWSLETTER_FROM_EMAIL') || 'Peluqueria Maria <newsletter@peluqueriamaria.com>';
      let status = 'sent';
      let errorMessage = '';

      if (!resendKey) {
        status = 'failed';
        errorMessage = 'Falta RESEND_API_KEY en Supabase Edge Functions.';
      } else {
        const response = await fetch('https://api.resend.com/emails', {
          method: 'POST',
          headers: {
            Authorization: `Bearer ${resendKey}`,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            from: fromEmail,
            to: recipients,
            subject,
            html: bodyHtml
          })
        });
        if (!response.ok) {
          status = 'failed';
          errorMessage = await response.text();
        }
      }

      const { data: campaign, error } = await supabase.from('newsletter_campaigns').insert({
        salon_id: salonId,
        subject,
        template,
        body_html: bodyHtml,
        status,
        recipient_count: recipients.length,
        sent_at: status === 'sent' ? new Date().toISOString() : null,
        error_message: errorMessage || null
      }).select('*').single();
      if (error) throw error;
      if (status === 'failed') return jsonResponse({ campaign, error: errorMessage }, 500);
      return jsonResponse({ campaign });
    }

    if (action === 'create_appointment') {
      const salonId = await getSalonId();
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
        salon_id: salonId,
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
      if (payload.client_email) {
        const existingClient = await supabase.from('client_profiles').select('id').eq('email', payload.client_email).maybeSingle();
        if (existingClient.data?.id) {
          await supabase.from('client_profiles').update({ name: payload.client_name, phone: payload.client_phone, salon_id: salonId }).eq('id', existingClient.data.id);
        } else {
          await supabase.from('client_profiles').insert({ salon_id: salonId, name: payload.client_name, email: payload.client_email, phone: payload.client_phone });
        }
      }
      await sendAppointmentWhatsApp(data, 'confirmation');
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
      const salonId = await getSalonId();
      const method = body.method || 'all';
      const now = new Date();
      const lastClosure = await supabase
        .from('cash_register_closures')
        .select('*')
        .eq('salon_id', salonId)
        .eq('method', method)
        .order('to_at', { ascending: false })
        .limit(1)
        .maybeSingle();
      if (lastClosure.error) throw lastClosure.error;
      const fromAt = lastClosure.data?.to_at || new Date(0).toISOString();
      let query = supabase.from('pos_sales').select('*').eq('salon_id', salonId).gt('created_at', fromAt).lte('created_at', now.toISOString());
      if (method !== 'all') query = query.eq('payment_method', method);
      const salesResult = await query.order('created_at', { ascending: true });
      if (salesResult.error) throw salesResult.error;
      const selectedSales = salesResult.data || [];
      const totalCents = selectedSales.reduce((sum: number, sale: any) => sum + Number(sale.total_cents || 0), 0);
      const closure = await supabase.from('cash_register_closures').insert({
        salon_id: salonId,
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
      const salonId = await getSalonId();
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
        salon_id: salonId,
        name: String(staff.name || '').trim(),
        role: staff.role || 'stylist',
        is_active: staff.is_active !== false
      }).select('*').single();
      if (stylistResult.error) throw stylistResult.error;

      const { data, error } = await supabase.from('staff_profiles').upsert({
        id: staff.id || undefined,
        salon_id: salonId,
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
