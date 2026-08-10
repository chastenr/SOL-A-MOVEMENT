import { NextResponse, after } from "next/server";
import { format } from "date-fns";
import { requireUserApi, AuthError } from "@/lib/auth/require-role";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { isPhoneVerificationRequired } from "@/lib/feature-flags";
import { bookClassSchema } from "@/lib/validations";
import { isRateLimited } from "@/lib/rate-limit";
import { centavosToPeso } from "@/lib/money";
import { getArrivalTime } from "@/lib/studio-hours";
import { formatBookingReference } from "@/lib/utils";
import { sendClassBookingConfirmationEmail, sendClassBookingNotificationEmail } from "@/lib/email";
import { isSmsConfigured, sendSms } from "@/lib/sms";

const ERROR_MAP: Record<string, { status: number; message: string }> = {
  P0000: { status: 401, message: "Please sign in." },
  P0001: { status: 404, message: "That package could not be found." },
  P0002: { status: 409, message: "This package has expired." },
  P0003: { status: 409, message: "This package has no remaining credits." },
  P0004: { status: 404, message: "That class could not be found." },
  P0005: { status: 409, message: "You already have a booking for this class." },
  P0006: { status: 409, message: "Sorry, this class just filled up." },
  P0009: { status: 409, message: "Bookings close at 10:00 PM the evening before class." },
  P0010: { status: 409, message: "Bookings are currently closed for this class." },
  // book_class_session() takes row locks on the package and session (see
  // migration 0013) so two overlapping requests for the same booking
  // normally just serialize and the second gets a proper P0005 above — but
  // under real contention Postgres/the pooler can still time out the wait
  // instead of granting it. These codes are that "briefly busy," not a real
  // failure, so they get a retry-friendly message instead of the generic one.
  "55P03": { status: 409, message: "That's taking longer than expected — please try again." },
  "40001": { status: 409, message: "That's taking longer than expected — please try again." },
  "40P01": { status: 409, message: "That's taking longer than expected — please try again." },
  "57014": { status: 409, message: "That's taking longer than expected — please try again." },
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
    // Same reasoning as the big try below: getAuthedUser() normally just
    // returns null on a failed check, but a genuine exception here (e.g. a
    // JWKS fetch hiccup inside getClaims()) used to be rethrown past this
    // function entirely, so Next.js rendered its own non-JSON error page and
    // the customer saw a contentless "Something went wrong" with no log line
    // to explain why.
    console.error("[/api/bookings] requireUserApi threw unexpectedly", { error });
    return NextResponse.json({ message: "Something went wrong. Please try again." }, { status: 500 });
  }

  // Everything below can hit the network (Postgres, the pooler) — a
  // connection reset, a lock-wait timeout, or any other error the RPC
  // doesn't explicitly raise would otherwise escape as an unhandled
  // exception. Next.js then renders its own error page instead of JSON, the
  // client's `response.json()` fails to parse it, and the customer sees a
  // contentless "Something went wrong" with nothing in the logs to explain
  // why. Catching everything here guarantees a JSON body either way, and
  // logs the real error server-side so the next occurrence is diagnosable.
  try {
    const supabase = await createSupabaseServerClient();

    if (isPhoneVerificationRequired()) {
      const { data: profile, error: profileError } = await supabase
        .from("profiles")
        .select("phone_verified_at")
        .eq("id", user.id)
        .single();
      if (profileError) {
        console.error("[/api/bookings] profile lookup failed", { userId: user.id, profileError });
        return NextResponse.json({ message: "Something went wrong. Please try again." }, { status: 500 });
      }
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
      const mapped = ERROR_MAP[error.code ?? ""];
      if (!mapped) {
        console.error("[/api/bookings] unmapped book_class_session error", {
          userId: user.id,
          classSessionId: parsed.data.classSessionId,
          customerPackageId: parsed.data.customerPackageId,
          code: error.code,
          message: error.message,
          details: error.details,
          hint: error.hint,
        });
      }
      return NextResponse.json(
        { message: mapped?.message ?? "Something went wrong. Please try again." },
        { status: mapped?.status ?? 500 }
      );
    }

    const result = data as { booking_id: string; remaining_credits: number };

    // after() runs once the response has been sent — the booking (already
    // committed by the RPC above) doesn't wait on two emails' worth of
    // network round-trips before the customer sees "booked."
    after(() => notifyBookingCreated(supabase, result.booking_id, result.remaining_credits));

    return NextResponse.json({ success: true, bookingId: result.booking_id, remainingCredits: result.remaining_credits });
  } catch (error) {
    console.error("[/api/bookings] unhandled error", { userId: user.id, error });
    return NextResponse.json({ message: "Something went wrong. Please try again." }, { status: 500 });
  }
}

type BookingNotificationRow = {
  user_id: string;
  class_session: {
    start_at: string;
    end_at: string;
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
       class_session:class_sessions(start_at, end_at, class_type:class_types(name), instructor:instructors(name)),
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
  const endAt = row.class_session?.end_at ? new Date(row.class_session.end_at) : null;
  const formattedDate = startAt ? format(startAt, "MMMM d, yyyy") : "—";
  const time = startAt ? format(startAt, "h:mm a") : "—";
  const endTime = endAt ? format(endAt, "h:mm a") : "—";
  const arrivalTime = startAt ? format(getArrivalTime(startAt), "h:mm a") : "—";
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
      endTime,
      arrivalTime,
      bookingReference: formatBookingReference(bookingId),
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
    ...(isSmsConfigured && user?.mobile_number
      ? [
          sendSms({
            to: user.mobile_number,
            body: `Veora Wellness: Your ${className} class is booked for ${formattedDate} at ${time}. Ref ${formatBookingReference(bookingId)}. Credits left: ${remainingCredits}.`,
          }),
        ]
      : []),
  ]);
}
