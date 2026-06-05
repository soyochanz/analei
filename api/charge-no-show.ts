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
    const {
      appointmentId,
      clientName,
      customerId,
      paymentMethodId,
      amount = 4000
    } = req.body || {};

    if (!customerId || !paymentMethodId) {
      return res.status(400).json({ error: 'La cita no tiene una tarjeta de garantia guardada.' });
    }

    const paymentIntent = await stripe.paymentIntents.create({
      amount: Number(amount),
      currency: 'eur',
      customer: customerId,
      payment_method: paymentMethodId,
      confirm: true,
      off_session: true,
      description: `Penalizacion no-show - ${clientName || appointmentId}`,
      metadata: {
        appointmentId: String(appointmentId || ''),
        clientName: String(clientName || ''),
        reason: 'no_show'
      }
    });

    return res.status(200).json({
      paymentIntentId: paymentIntent.id,
      status: paymentIntent.status
    });
  } catch (error: any) {
    if (error.code === 'authentication_required' && error.payment_intent?.id) {
      return res.status(402).json({
        error: 'La tarjeta requiere autenticacion del cliente antes de poder cobrarla.',
        paymentIntentId: error.payment_intent.id
      });
    }

    return res.status(500).json({ error: error.message || 'No-show charge failed' });
  }
}
