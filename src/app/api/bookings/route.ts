import { NextResponse } from "next/server";
import { requireUserApi, AuthError } from "@/lib/auth/require-role";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { isPhoneVerificationRequired } from "@/lib/feature-flags";
import { bookClassSchema } from "@/lib/validations";
import { isRateLimited } from "@/lib/rate-limit";

const ERROR_MAP: Record<string, { status: number; message: string }> = {
  P0000: { status: 401, message: "Please sign in." },
  P0001: { status: 404, message: "That package could not be found." },
  P0002: { status: 409, message: "This package has expired." },
  P0003: { status: 409, message: "This package has no remaining credits." },
  P0004: { status: 404, message: "That class could not be found." },
  P0005: { status: 409, message: "You already have a booking for this class." },
  P0006: { status: 409, message: "Sorry, this class just filled up." },
};

/**
 * The real, credit-based authenticated booking engine — distinct from the
 * guest /api/book flow. Auth + phone-verification + ownership + capacity +
 * credit checks all happen server-side; the actual booking + credit
 * deduction is one atomic Postgres transaction (book_class_session() in
 * migration 0001), never two separate client/server calls.
 */
export async function POST(request: Request) {
  let user;
  try {
    user = await requireUserApi();
  } catch (error) {
    if (error instanceof AuthError) return NextResponse.json({ message: error.message }, { status: error.status });
    throw error;
  }

  const supabase = await createSupabaseServerClient();

  if (isPhoneVerificationRequired()) {
    const { data: profile } = await supabase.from("profiles").select("phone_verified_at").eq("id", user.id).single();
    if (!profile?.phone_verified_at) {
      return NextResponse.json(
        { message: "Please verify your mobile number first.", code: "PHONE_NOT_VERIFIED" },
        { status: 403 }
      );
    }
  }

  const rateLimitKey = `booking:${user.id}`;
  if (isRateLimited(rateLimitKey, { windowMs: 60 * 1000, max: 5 })) {
    return NextResponse.json({ message: "Please slow down and try again in a moment." }, { status: 429 });
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ message: "Invalid request." }, { status: 400 });
  }

  const parsed = bookClassSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ message: "Please select a class and package." }, { status: 400 });
  }

  const { data, error } = await supabase
    .rpc("book_class_session", {
      p_class_session_id: parsed.data.classSessionId,
      p_customer_package_id: parsed.data.customerPackageId,
    })
    .single();

  if (error) {
    const mapped = ERROR_MAP[error.code ?? ""] ?? { status: 500, message: "Something went wrong. Please try again." };
    return NextResponse.json({ message: mapped.message }, { status: mapped.status });
  }

  const result = data as { booking_id: string; remaining_credits: number };
  return NextResponse.json({ success: true, bookingId: result.booking_id, remainingCredits: result.remaining_credits });
}
