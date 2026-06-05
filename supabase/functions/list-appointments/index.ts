import { createAdminClient } from '../_shared/admin.ts';
import { handleOptions, jsonResponse } from '../_shared/http.ts';

Deno.serve(async (req) => {
  const optionsResponse = handleOptions(req);
  if (optionsResponse) return optionsResponse;
  if (req.method !== 'POST') return jsonResponse({ error: 'Method not allowed' }, 405);

  try {
    const supabase = createAdminClient();
    const { data, error } = await supabase
      .from('appointments')
      .select('*')
      .order('appointment_date', { ascending: false })
      .order('created_at', { ascending: false })
      .limit(200);

    if (error) throw error;
    return jsonResponse({ appointments: data || [] });
  } catch (error) {
    return jsonResponse({ error: error instanceof Error ? error.message : 'No se pudieron cargar las citas.' }, 500);
  }
});

