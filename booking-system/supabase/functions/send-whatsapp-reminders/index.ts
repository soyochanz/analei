import { createAdminClient } from '../_shared/admin.ts';
import { handleOptions, jsonResponse } from '../_shared/http.ts';
import { sendAppointmentWhatsApp } from '../_shared/whatsapp.ts';

const appointmentDateTime = (date: string, time: string) => {
  const match = String(time || '').match(/(\d{1,2}):(\d{2})\s*(AM|PM)?/i);
  if (!match) return null;
  let hour = Number(match[1]);
  const minute = Number(match[2]);
  const suffix = match[3]?.toUpperCase();
  if (suffix === 'PM' && hour !== 12) hour += 12;
  if (suffix === 'AM' && hour === 12) hour = 0;
  return new Date(`${date}T${String(hour).padStart(2, '0')}:${String(minute).padStart(2, '0')}:00+02:00`);
};

Deno.serve(async (req) => {
  const optionsResponse = handleOptions(req);
  if (optionsResponse) return optionsResponse;
  if (req.method !== 'POST') return jsonResponse({ error: 'Method not allowed' }, 405);

  const cronSecret = Deno.env.get('WHATSAPP_CRON_SECRET');
  if (cronSecret && req.headers.get('x-cron-secret') !== cronSecret) {
    return jsonResponse({ error: 'Unauthorized' }, 401);
  }

  try {
    const supabase = createAdminClient();
    const now = new Date();
    const windowStart = new Date(now.getTime() + 110 * 60 * 1000);
    const windowEnd = new Date(now.getTime() + 130 * 60 * 1000);
    const dateStart = windowStart.toISOString().slice(0, 10);
    const dateEnd = windowEnd.toISOString().slice(0, 10);

    const { data: appointments, error } = await supabase
      .from('appointments')
      .select('*')
      .gte('appointment_date', dateStart)
      .lte('appointment_date', dateEnd)
      .neq('status', 'Cancelled');
    if (error) throw error;

    const { data: existing, error: existingError } = await supabase
      .from('whatsapp_notifications')
      .select('appointment_id')
      .eq('notification_type', 'reminder_2h')
      .in('status', ['sent', 'pending']);
    if (existingError) throw existingError;

    const alreadyHandled = new Set((existing || []).map(item => item.appointment_id));
    const due = (appointments || []).filter(appointment => {
      if (!appointment.client_phone || alreadyHandled.has(appointment.id)) return false;
      const startsAt = appointmentDateTime(appointment.appointment_date, appointment.appointment_time);
      return startsAt && startsAt >= windowStart && startsAt <= windowEnd;
    });

    const results = [];
    for (const appointment of due) {
      results.push({ appointmentId: appointment.id, result: await sendAppointmentWhatsApp(appointment, 'reminder_2h') });
    }

    return jsonResponse({ checked: appointments?.length || 0, due: due.length, results });
  } catch (error) {
    return jsonResponse({ error: error instanceof Error ? error.message : 'No se pudieron enviar recordatorios.' }, 500);
  }
});
