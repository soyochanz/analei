import Stripe from 'stripe';

const stripeSecretKey = process.env.STRIPE_SECRET_KEY;
const stripe = stripeSecretKey ? new Stripe(stripeSecretKey, { apiVersion: '2026-05-27.dahlia' }) : null;

export default async function handler(req: any, res: any) {
  if (req.method !== 'POST') {
    res.setHeader('Allow', 'POST');
    return res.status(405).json({ error: 'Method not allowed' });
  }

  if (!stripe) {
    return res.status(500).json({ error: 'Falta configurar STRIPE_SECRET_KEY en el servidor.' });
  }

  try {
    const { appointmentDate, appointmentTime, service, noShowFeeAmount } = req.body || {};

    const customer = await stripe.customers.create({
      metadata: {
        source: 'analei-booking',
        appointmentDate: String(appointmentDate || ''),
        appointmentTime: String(appointmentTime || ''),
        service: String(service || ''),
        noShowFeeAmount: String(noShowFeeAmount || '')
      }
    });

    const setupIntent = await stripe.setupIntents.create({
      customer: customer.id,
      payment_method_types: ['card'],
      usage: 'off_session',
      metadata: {
        appointmentDate: String(appointmentDate || ''),
        appointmentTime: String(appointmentTime || ''),
        service: String(service || ''),
        noShowFeeAmount: String(noShowFeeAmount || '')
      }
    });

    return res.status(200).json({
      clientSecret: setupIntent.client_secret,
      customerId: customer.id
    });
  } catch (error: any) {
    return res.status(500).json({ error: error.message || 'Stripe setup failed' });
  }
}
