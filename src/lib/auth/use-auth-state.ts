"use client";

import { useEffect, useState } from "react";
import { createSupabaseBrowserClient } from "@/lib/supabase/client";

/**
 * Client-side auth state for UI purposes only (e.g. "Login" vs "My Account"
 * in the navbar) — never used for an authorization decision. Every
 * protected page/action re-verifies server-side regardless of what this
 * hook reports, so this can use the cheaper `getClaims()` (local JWT
 * verification against this project's asymmetric signing key, no network
 * round-trip) instead of `getUser()`.
 */
export function useAuthState(): { signedIn: boolean; loading: boolean } {
  const [signedIn, setSignedIn] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const supabase = createSupabaseBrowserClient();

    supabase.auth.getClaims().then(({ data }) => {
      setSignedIn(Boolean(data?.claims));
      setLoading(false);
    });

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setSignedIn(Boolean(session?.user));
    });

    return () => subscription.unsubscribe();
  }, []);

  return { signedIn, loading };
}
