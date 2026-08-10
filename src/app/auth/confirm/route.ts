import type { EmailOtpType } from "@supabase/supabase-js";
import { NextResponse, type NextRequest } from "next/server";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { sanitizeRedirectTo } from "@/lib/utils";

/**
 * Exchanges the single-use token embedded in Veora auth emails for a
 * cookie-backed session, then sends the customer to the intended page.
 */
export async function GET(request: NextRequest) {
  const tokenHash = request.nextUrl.searchParams.get("token_hash");
  const type = request.nextUrl.searchParams.get("type") as EmailOtpType | null;
  const next = sanitizeRedirectTo(request.nextUrl.searchParams.get("next"), "/account");

  if (tokenHash && type) {
    const supabase = await createSupabaseServerClient();
    const { error } = await supabase.auth.verifyOtp({ token_hash: tokenHash, type });

    if (!error) {
      return NextResponse.redirect(new URL(next, request.nextUrl.origin));
    }
  }

  return NextResponse.redirect(
    new URL("/forgot-password?error=invalid_or_expired_link", request.nextUrl.origin)
  );
}
