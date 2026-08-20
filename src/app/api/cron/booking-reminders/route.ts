import { NextResponse } from "next/server";
import { isSupabaseConfigured, supabaseAdmin } from "@/lib/supabase/admin";
import { isSmsConfigured } from "@/lib/sms";
import { sendBookingReminderSms } from "@/lib/booking-sms";
import { getBookingReminderType } from "@/lib/booking-reminders";

const MINUTE_MS = 60 * 1000;

type ReminderBooking = {
  id: string;
  user_id: string;
  class_session: {
    start_at: string;
    status: "scheduled" | "cancelled" | "completed";
    class_type: { name: string } | null;
    instructor: { name: string } | null;
  } | null;
};

export async function GET(request: Request) {
  const cronSecret = process.env.CRON_SECRET;
  if (!cronSecret || request.headers.get("authorization") !== `Bearer ${cronSecret}`) {
    return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
  }
  if (!isSupabaseConfigured || !supabaseAdmin || !isSmsConfigured) {
    return NextResponse.json({ message: "SMS reminders are not configured." }, { status: 503 });
  }

  const now = Date.now();
  const earliest = new Date(now + 110 * MINUTE_MS).toISOString();
  const latest = new Date(now + (24 * 60 + 10) * MINUTE_MS).toISOString();
  const { data, error } = await supabaseAdmin
    .from("class_bookings")
    .select(
      "id, user_id, class_session:class_sessions!inner(start_at, status, class_type:class_types(name), instructor:instructors(name))"
    )
    .eq("status", "booked")
    .eq("class_session.status", "scheduled")
    .gte("class_session.start_at", earliest)
    .lte("class_session.start_at", latest)
    .limit(500);

  if (error) {
    console.error("[booking-reminders] booking query failed", { error: error.message });
    return NextResponse.json({ message: "Failed to load reminder candidates." }, { status: 500 });
  }

  const bookings = (data as unknown as ReminderBooking[]) ?? [];
  const userIds = [...new Set(bookings.map((booking) => booking.user_id))];
  const { data: profiles } = userIds.length
    ? await supabaseAdmin
        .from("profiles")
        .select("id, mobile_number, phone_verified_at")
        .in("id", userIds)
        .not("phone_verified_at", "is", null)
    : { data: [] as Array<{ id: string; mobile_number: string; phone_verified_at: string }> };
  const profileById = new Map((profiles ?? []).map((profile) => [profile.id, profile]));

  let sent = 0;
  let skipped = 0;
  let failed = 0;

  for (const booking of bookings) {
    const session = booking.class_session;
    const profile = profileById.get(booking.user_id);
    if (!session || session.status !== "scheduled" || !profile?.mobile_number) {
      skipped += 1;
      continue;
    }

    const reminderType = getBookingReminderType(session.start_at, new Date(now));
    if (!reminderType) {
      skipped += 1;
      continue;
    }

    const result = await sendBookingReminderSms({
      bookingId: booking.id,
      type: reminderType,
      to: profile.mobile_number,
      className: session.class_type?.name ?? "Class",
      coachName: session.instructor?.name ?? "TBA",
      startAt: session.start_at,
    });
    if (result === "sent") sent += 1;
    else if (result === "failed") failed += 1;
    else skipped += 1;
  }

  return NextResponse.json({ evaluated: bookings.length, sent, skipped, failed });
}
