import Stripe from 'https://esm.sh/stripe@17.6.0?target=deno';
import { createAdminClient } from '../_shared/admin.ts';
import { handleOptions, jsonResponse } from '../_shared/http.ts';

const NO_SHOW_FEE_CENTS = 4000;

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
    const serviceName = String(body.service || '');

    const { data: service, error: serviceError } = await supabase
      .from('services')
      .select('id, name, price_cents')
      .eq('name', serviceName)
      .eq('is_active', true)
      .maybeSingle();

    if (serviceError) throw serviceError;
    if (!service) return jsonResponse({ error: 'Servicio no encontrado.' }, 404);

    const customer = await stripe.customers.create({
      email: body.clientEmail || undefined,
      name: body.clientName || undefined,
      metadata: {
        source: 'peluqueria-maria-booking',
        appointmentDate: String(body.appointmentDate || ''),
        appointmentTime: String(body.appointmentTime || ''),
        serviceId: service.id,
        service: service.name,
        noShowFeeAmount: String(body.noShowFeeAmount || NO_SHOW_FEE_CENTS)
      }
    });

    const setupIntent = await stripe.setupIntents.create({
      customer: customer.id,
      payment_method_types: ['card'],
      usage: 'off_session',
      metadata: {
        appointmentDate: String(body.appointmentDate || ''),
        appointmentTime: String(body.appointmentTime || ''),
        serviceId: service.id,
        service: service.name,
        noShowFeeAmount: String(body.noShowFeeAmount || NO_SHOW_FEE_CENTS)
      }
    });

    return jsonResponse({
      clientSecret: setupIntent.client_secret,
      customerId: customer.id,
      serviceId: service.id,
      priceCents: service.price_cents
    });
  } catch (error) {
    return jsonResponse({ error: error instanceof Error ? error.message : 'Stripe setup failed' }, 500);
  }
});

