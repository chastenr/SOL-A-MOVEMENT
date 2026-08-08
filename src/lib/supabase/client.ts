import { createBrowserClient } from "@supabase/ssr";

/**
 * Browser Supabase client (anon key, cookie-based session). Safe to import
 * from client components — never carries the service role key.
 */
export function createSupabaseBrowserClient() {
  return createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );
}
