import { createClient, SupabaseClient } from '@supabase/supabase-js';

export type BookingClientConfig = {
  supabaseUrl: string;
  supabaseAnonKey: string;
  persistSession?: boolean;
};

export type BookingClient = {
  supabase: SupabaseClient;
  invokeFunction: <T>(name: string, body: unknown) => Promise<T>;
};

export const createBookingClient = ({
  supabaseUrl,
  supabaseAnonKey,
  persistSession = true
}: BookingClientConfig): BookingClient => {
  if (!supabaseUrl || !supabaseAnonKey) {
    throw new Error('Faltan supabaseUrl y supabaseAnonKey.');
  }

  const supabase = createClient(supabaseUrl, supabaseAnonKey, {
    auth: {
      persistSession,
      autoRefreshToken: true
    }
  });

  const invokeFunction = async <T>(name: string, body: unknown): Promise<T> => {
    const { data, error } = await supabase.functions.invoke(name, { body });
    if (error) {
      const context = (error as { context?: unknown }).context;
      if (context instanceof Response) {
        const payload = await context.json().catch(() => null);
        if (payload?.error) throw new Error(payload.error);
      }
      throw error;
    }
    return data as T;
  };

  return { supabase, invokeFunction };
};

export const createViteBookingClient = () => {
  const env = import.meta.env as Record<string, string | undefined>;
  return createBookingClient({
    supabaseUrl: env.VITE_SUPABASE_URL || '',
    supabaseAnonKey: env.VITE_SUPABASE_ANON_KEY || ''
  });
};
