import { createAdminClient } from './admin.ts';

type AppointmentMessage = {
  id: string;
  salon_id?: string | null;
  client_name: string;
  client_phone?: string | null;
  service_name: string;
  appointment_date: string;
  appointment_time: string;
};

const normalizePhone = (phone?: string | null) => {
  const raw = String(phone || '').trim();
  if (!raw) return '';
  if (raw.startsWith('+')) return raw.replace(/[^\d+]/g, '');
  const digits = raw.replace(/\D/g, '');
  if (digits.length === 9) return `+34${digits}`;
  if (digits.length === 11 && digits.startsWith('34')) return `+${digits}`;
  return digits ? `+${digits}` : '';
};

const templateNameFor = (type: 'confirmation' | 'reminder_2h') =>
  type === 'confirmation'
    ? Deno.env.get('WHATSAPP_TEMPLATE_CONFIRMATION') || 'appointment_confirmation'
    : Deno.env.get('WHATSAPP_TEMPLATE_REMINDER') || 'appointment_reminder_2h';

export const sendAppointmentWhatsApp = async (
  appointment: AppointmentMessage,
  type: 'confirmation' | 'reminder_2h'
) => {
  const supabase = createAdminClient();
  const phone = normalizePhone(appointment.client_phone);

  if (!phone) {
    await supabase.from('whatsapp_notifications').upsert({
      appointment_id: appointment.id,
      salon_id: appointment.salon_id || null,
      notification_type: type,
      phone: 'missing',
      status: 'skipped',
      error_message: 'La cita no tiene telefono.'
    }, { onConflict: 'appointment_id,notification_type' });
    return { ok: false, skipped: true, error: 'La cita no tiene telefono.' };
  }

  const accessToken = Deno.env.get('WHATSAPP_ACCESS_TOKEN');
  const phoneNumberId = Deno.env.get('WHATSAPP_PHONE_NUMBER_ID');
  if (!accessToken || !phoneNumberId) {
    await supabase.from('whatsapp_notifications').upsert({
      appointment_id: appointment.id,
      salon_id: appointment.salon_id || null,
      notification_type: type,
      phone,
      status: 'failed',
      error_message: 'Faltan WHATSAPP_ACCESS_TOKEN o WHATSAPP_PHONE_NUMBER_ID.'
    }, { onConflict: 'appointment_id,notification_type' });
    return { ok: false, error: 'Faltan WHATSAPP_ACCESS_TOKEN o WHATSAPP_PHONE_NUMBER_ID.' };
  }

  const response = await fetch(`https://graph.facebook.com/v20.0/${phoneNumberId}/messages`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${accessToken}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      messaging_product: 'whatsapp',
      to: phone,
      type: 'template',
      template: {
        name: templateNameFor(type),
        language: { code: Deno.env.get('WHATSAPP_TEMPLATE_LANGUAGE') || 'es' },
        components: [
          {
            type: 'body',
            parameters: [
              { type: 'text', text: appointment.client_name },
              { type: 'text', text: appointment.service_name },
              { type: 'text', text: appointment.appointment_date },
              { type: 'text', text: appointment.appointment_time }
            ]
          }
        ]
      }
    })
  });

  const payload = await response.json().catch(() => ({}));
  if (!response.ok) {
    const errorMessage = payload?.error?.message || JSON.stringify(payload);
    await supabase.from('whatsapp_notifications').upsert({
      appointment_id: appointment.id,
      salon_id: appointment.salon_id || null,
      notification_type: type,
      phone,
      status: 'failed',
      error_message: errorMessage
    }, { onConflict: 'appointment_id,notification_type' });
    return { ok: false, error: errorMessage };
  }

  const messageId = payload?.messages?.[0]?.id || null;
  await supabase.from('whatsapp_notifications').upsert({
    appointment_id: appointment.id,
    salon_id: appointment.salon_id || null,
    notification_type: type,
    phone,
    status: 'sent',
    provider_message_id: messageId,
    error_message: null,
    sent_at: new Date().toISOString()
  }, { onConflict: 'appointment_id,notification_type' });

  return { ok: true, messageId };
};
