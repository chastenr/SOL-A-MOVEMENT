import { NextResponse, after } from "next/server";
import { format } from "date-fns";
import { requireUserApi, AuthError } from "@/lib/auth/require-role";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { isPhoneVerificationRequired } from "@/lib/feature-flags";
import { bookClassSchema } from "@/lib/validations";
import { isRateLimited } from "@/lib/rate-limit";
import { centavosToPeso } from "@/lib/money";
import { sendClassBookingConfirmationEmail, sendClassBookingNotificationEmail } from "@/lib/email";

const ERROR_MAP: Record<string, { status: number; message: string }> = {
  P0000: { status: 401, message: "Please sign in." },
  P0001: { status: 404, message: "That package could not be found." },
  P0002: { status: 409, message: "This package has expired." },
  P0003: { status: 409, message: "This package has no remaining credits." },
  P0004: { status: 404, message: "That class could not be found." },
  P0005: { status: 409, message: "You already have a booking for this class." },
  P0006: { status: 409, message: "Sorry, this class just filled up." },
  P0009: { status: 409, message: "Bookings close at 10:00 PM the evening before class." },
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

  // after() runs once the response has been sent — the booking (already
  // committed by the RPC above) doesn't wait on two emails' worth of
  // network round-trips before the customer sees "booked."
  after(() => notifyBookingCreated(supabase, result.booking_id, result.remaining_credits));

  return NextResponse.json({ success: true, bookingId: result.booking_id, remainingCredits: result.remaining_credits });
}

type BookingNotificationRow = {
  user_id: string;
  class_session: {
    start_at: string;
    class_type: { name: string } | null;
    instructor: { name: string } | null;
  } | null;
  customer_package: {
    credit_count: number;
    package_name_snapshot: string;
    purchase: { total_amount_centavos: number } | null;
  } | null;
};

/**
 * Fire-and-forget (errors swallowed via allSettled, matching /api/book) —
 * an email hiccup should never fail a booking that already succeeded and
 * already deducted a real credit. Two separate queries because
 * class_bookings.user_id references auth.users, not public.profiles —
 * PostgREST can't auto-embed across that (same limitation noted elsewhere
 * in this codebase, e.g. audit_logs.actor_id).
 */
async function notifyBookingCreated(
  supabase: Awaited<ReturnType<typeof createSupabaseServerClient>>,
  bookingId: string,
  remainingCredits: number
) {
  const { data: booking } = await supabase
    .from("class_bookings")
    .select(
      `user_id,
       class_session:class_sessions(start_at, class_type:class_types(name), instructor:instructors(name)),
       customer_package:customer_packages(credit_count, package_name_snapshot, purchase:purchases(total_amount_centavos))`
    )
    .eq("id", bookingId)
    .single();

  if (!booking) return;
  const row = booking as unknown as BookingNotificationRow;

  const { data: user } = await supabase
    .from("profiles")
    .select("first_name, last_name, email, mobile_number")
    .eq("id", row.user_id)
    .single();

  const className = row.class_session?.class_type?.name ?? "Class";
  const coachName = row.class_session?.instructor?.name ?? "TBA";
  const startAt = row.class_session?.start_at ? new Date(row.class_session.start_at) : null;
  const formattedDate = startAt ? format(startAt, "MMMM d, yyyy") : "—";
  const time = startAt ? format(startAt, "h:mm a") : "—";
  const packageName = row.customer_package?.package_name_snapshot ?? "—";
  const originalSessions = row.customer_package?.credit_count ?? 0;
  const amountCentavos = row.customer_package?.purchase?.total_amount_centavos ?? 0;

  await Promise.allSettled([
    sendClassBookingConfirmationEmail({
      customerFirstName: user?.first_name || "there",
      customerEmail: user?.email ?? "",
      className,
      coachName,
      formattedDate,
      time,
      packageName,
      sessionsRemaining: remainingCredits,
    }),
    sendClassBookingNotificationEmail({
      customerFirstName: user?.first_name ?? "",
      customerLastName: user?.last_name ?? "",
      customerEmail: user?.email ?? "",
      customerPhone: user?.mobile_number ?? "",
      className,
      coachName,
      formattedDate,
      time,
      packageName,
      packageAmountFormatted: centavosToPeso(amountCentavos),
      originalSessions,
      sessionsUsed: originalSessions - remainingCredits,
      sessionsRemaining: remainingCredits,
      status: "Confirmed",
    }),
  ]);
}
