import { createClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

export const isSupabaseConfigured = Boolean(supabaseUrl && serviceRoleKey);

/**
 * Server-only Supabase client using the service role key.
 * Booking storage and the double-booking check are skipped entirely when
 * Supabase env vars are not configured — the site still works via email only.
 */
export const supabaseAdmin = isSupabaseConfigured
  ? createClient(supabaseUrl as string, serviceRoleKey as string, {
      auth: { persistSession: false },
    })
  : null;
