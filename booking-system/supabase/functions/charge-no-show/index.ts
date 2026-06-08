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
    const appointmentId = String(body.appointmentId || '');

    if (!appointmentId) return jsonResponse({ error: 'Falta appointmentId.' }, 400);

    const { data: appointment, error: appointmentError } = await supabase
      .from('appointments')
      .select('*')
      .eq('id', appointmentId)
      .maybeSingle();

    if (appointmentError) throw appointmentError;
    if (!appointment) return jsonResponse({ error: 'Cita no encontrada.' }, 404);
    if (!appointment.stripe_customer_id || !appointment.stripe_payment_method_id) {
      return jsonResponse({ error: 'La cita no tiene tarjeta de garantia.' }, 400);
    }
    if (appointment.payment_guarantee_status === 'charged') {
      return jsonResponse({ error: 'Esta cita ya tiene un cargo no-show registrado.' }, 409);
    }

    const { data: policy } = await supabase
      .from('no_show_policy')
      .select('*')
      .eq('id', true)
      .maybeSingle();

    const noShowFeeCents = !policy?.enabled
      ? 0
      : policy.charge_type === 'percentage'
        ? Math.round(Number(appointment.price_cents || 0) * Number(policy.percentage || 0) / 100)
        : Number(policy.fixed_cents ?? 4000);

    if (noShowFeeCents <= 0) {
      return jsonResponse({ error: 'La politica no-show actual no tiene cargo configurado.' }, 400);
    }

    const paymentIntent = await stripe.paymentIntents.create({
      amount: noShowFeeCents,
      currency: 'eur',
      customer: appointment.stripe_customer_id,
      payment_method: appointment.stripe_payment_method_id,
      confirm: true,
      off_session: true,
      description: `Penalizacion no-show - ${appointment.client_name}`,
      metadata: {
        appointmentId: appointment.id,
        clientName: appointment.client_name,
        reason: 'no_show'
      }
    });

    const { data: updated, error: updateError } = await supabase
      .from('appointments')
      .update({
        status: 'NoShow',
        payment_guarantee_status: 'charged',
        no_show_fee_cents: noShowFeeCents,
        no_show_charge_id: paymentIntent.id
      })
      .eq('id', appointment.id)
      .select('*')
      .single();

    if (updateError) throw updateError;
    return jsonResponse({ appointment: updated, paymentIntentId: paymentIntent.id, status: paymentIntent.status });
  } catch (error) {
    const stripeError = error as { code?: string; payment_intent?: { id?: string }; message?: string };
    if (stripeError.code === 'authentication_required' && stripeError.payment_intent?.id) {
      return jsonResponse({
        error: 'La tarjeta requiere autenticacion del cliente antes de poder cobrarla.',
        paymentIntentId: stripeError.payment_intent.id
      }, 402);
    }

    return jsonResponse({ error: stripeError.message || 'No se pudo cobrar el no-show.' }, 500);
  }
});
