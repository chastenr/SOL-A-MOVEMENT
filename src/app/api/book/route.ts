import { NextResponse } from "next/server";
import { format, parseISO } from "date-fns";
import { bookingSchema } from "@/lib/validations";
import { getServiceBySlug } from "@/lib/catalog/services";
import { isSupabaseConfigured, supabaseAdmin } from "@/lib/supabase/admin";
import { sendCustomerBookingEmail, sendOwnerBookingEmail } from "@/lib/email";
import { getClientKey, isRateLimited } from "@/lib/rate-limit";
import { isRateLimitedDb } from "@/lib/rate-limit-db";

export async function POST(request: Request) {
  const rateLimitKey = getClientKey(request, "book");
  // Same layered in-memory + DB-backed check as /api/contact — this is the
  // other anonymous, email-triggering route (see migration 0007).
  if (isRateLimited(rateLimitKey) || (await isRateLimitedDb(rateLimitKey, 600, 5))) {
    return NextResponse.json(
      { message: "Too many booking attempts. Please try again in a few minutes." },
      { status: 429 }
    );
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ message: "Invalid request." }, { status: 400 });
  }

  const parsed = bookingSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { message: "Please check your booking details and try again.", issues: parsed.error.issues },
      { status: 400 }
    );
  }

  const booking = parsed.data;
  const service = await getServiceBySlug(booking.service);
  if (!service) {
    return NextResponse.json({ message: "That service could not be found." }, { status: 400 });
  }

  if (isSupabaseConfigured && supabaseAdmin) {
    const { data: existing, error: lookupError } = await supabaseAdmin
      .from("bookings")
      .select("id")
      .eq("service_slug", booking.service)
      .eq("session_date", booking.date)
      .eq("session_time", booking.time)
      .limit(1)
      .maybeSingle();

    if (lookupError) {
      return NextResponse.json(
        { message: "Something went wrong while checking availability. Please try again." },
        { status: 500 }
      );
    }

    if (existing) {
      return NextResponse.json(
        { message: "Sorry, this time was just booked. Please choose another available time." },
        { status: 409 }
      );
    }

    const { error: insertError } = await supabaseAdmin.from("bookings").insert({
      service_slug: booking.service,
      session_date: booking.date,
      session_time: booking.time,
      first_name: booking.firstName,
      last_name: booking.lastName,
      email: booking.email,
      phone: booking.phone,
      notes: booking.notes || null,
      package_name: booking.packageName || null,
    });

    if (insertError) {
      // Unique constraint violation — someone booked this exact slot between our check and insert.
      if (insertError.code === "23505") {
        return NextResponse.json(
          { message: "Sorry, this time was just booked. Please choose another available time." },
          { status: 409 }
        );
      }
      return NextResponse.json(
        { message: "Something went wrong while saving your booking. Please try again." },
        { status: 500 }
      );
    }
  }

  const formattedDate = format(parseISO(booking.date), "EEEE, MMMM d, yyyy");
  const submittedAt = format(new Date(), "MMMM d, yyyy 'at' h:mm a");

  const emailPayload = {
    firstName: booking.firstName,
    lastName: booking.lastName,
    email: booking.email,
    phone: booking.phone,
    serviceName: service.name,
    packageName: booking.packageName,
    formattedDate,
    time: booking.time,
    notes: booking.notes,
    submittedAt,
  };

  await Promise.allSettled([
    sendOwnerBookingEmail(emailPayload),
    sendCustomerBookingEmail(emailPayload),
  ]);

  return NextResponse.json({ success: true });
}
