import Stripe from 'https://esm.sh/stripe@17.6.0?target=deno';
import { createAdminClient } from '../_shared/admin.ts';
import { handleOptions, jsonResponse } from '../_shared/http.ts';

Deno.serve(async (req) => {
  const optionsResponse = handleOptions(req);
  if (optionsResponse) return optionsResponse;
  if (req.method !== 'POST') return jsonResponse({ error: 'Method not allowed' }, 405);

  try {
    const stripeSecretKey = Deno.env.get('STRIPE_SECRET_KEY');
    if (!stripeSecretKey) {
      return jsonResponse({ error: 'Falta configurar STRIPE_SECRET_KEY en Supabase Edge Functions.' }, 500);
    }

    const stripe = new Stripe(stripeSecretKey, {
      apiVersion: '2024-12-18.acacia'
    });
    const supabase = createAdminClient();
    const body = await req.json();

    const setupIntentId = String(body.setupIntentId || '');
    if (!setupIntentId) return jsonResponse({ error: 'Falta setupIntentId.' }, 400);

    const setupIntent = await stripe.setupIntents.retrieve(setupIntentId);
    if (setupIntent.status !== 'succeeded') {
      return jsonResponse({ error: 'La tarjeta aun no esta validada por Stripe.' }, 400);
    }

    const paymentMethodId = typeof setupIntent.payment_method === 'string'
      ? setupIntent.payment_method
      : setupIntent.payment_method?.id;
    const customerId = typeof setupIntent.customer === 'string'
      ? setupIntent.customer
      : setupIntent.customer?.id;

    if (!paymentMethodId || !customerId) {
      return jsonResponse({ error: 'Stripe no devolvio cliente o metodo de pago.' }, 400);
    }

    const serviceId = String(body.serviceId || setupIntent.metadata.serviceId || '');
    const stylistId = String(body.stylistId || setupIntent.metadata.stylistId || '');
    const { data: service, error: serviceError } = await supabase
      .from('services')
      .select('id, name, price_cents')
      .eq('id', serviceId)
      .eq('is_active', true)
      .maybeSingle();

    if (serviceError) throw serviceError;
    if (!service) return jsonResponse({ error: 'Servicio no encontrado.' }, 404);

    const { data: policy } = await supabase
      .from('no_show_policy')
      .select('*')
      .eq('id', true)
      .maybeSingle();
    const noShowFeeCents = !policy?.enabled
      ? 0
      : policy.charge_type === 'percentage'
        ? Math.round(service.price_cents * Number(policy.percentage || 0) / 100)
        : Number(policy.fixed_cents || 4000);

    const insertPayload = {
      client_name: String(body.clientName || '').trim(),
      client_email: String(body.clientEmail || '').trim(),
      service_id: service.id,
      service_name: service.name,
      stylist_id: stylistId || null,
      appointment_date: String(body.appointmentDate || setupIntent.metadata.appointmentDate || ''),
      appointment_time: String(body.appointmentTime || setupIntent.metadata.appointmentTime || ''),
      status: 'Pending',
      price_cents: service.price_cents,
      no_show_fee_cents: noShowFeeCents,
      stripe_customer_id: customerId,
      stripe_payment_method_id: paymentMethodId,
      stripe_setup_intent_id: setupIntent.id,
      payment_guarantee_status: 'secured'
    };

    if (!insertPayload.client_name || !insertPayload.client_email || !insertPayload.appointment_date || !insertPayload.appointment_time) {
      return jsonResponse({ error: 'Faltan datos obligatorios de la cita.' }, 400);
    }

    const { data: appointment, error: insertError } = await supabase
      .from('appointments')
      .insert(insertPayload)
      .select('*')
      .single();

    if (insertError) throw insertError;
    return jsonResponse({ appointment });
  } catch (error) {
    return jsonResponse({ error: error instanceof Error ? error.message : 'No se pudo guardar la cita.' }, 500);
  }
});
