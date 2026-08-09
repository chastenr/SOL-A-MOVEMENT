import "server-only";
import { createClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

export const isSupabaseConfigured = Boolean(supabaseUrl && serviceRoleKey);

/**
 * Server-only Supabase client using the service role key. Bypasses RLS
 * entirely — never import this from a client component, and never derive
 * a user id or role from anything other than `@/lib/auth/require-role`'s
 * `getAuthedUser()` (backed by the verified-JWT `auth.getClaims()` check).
 */
export const supabaseAdmin = isSupabaseConfigured
  ? createClient(supabaseUrl as string, serviceRoleKey as string, {
      auth: { persistSession: false },
    })
  : null;
