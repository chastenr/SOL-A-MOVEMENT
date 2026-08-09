import { NextResponse } from "next/server";
import { format } from "date-fns";
import { isSupabaseConfigured, supabaseAdmin } from "@/lib/supabase/admin";
import { getManilaDayRange } from "@/lib/booking-cutoff";
import { getArrivalTime } from "@/lib/studio-hours";
import { sendClassCancelledByStudioEmail, sendClassConfirmedEmail } from "@/lib/email";
import { isSmsConfigured, sendSms } from "@/lib/sms";

type CandidateSession = {
  id: string;
  start_at: string;
  end_at: string;
  booked_count: number;
  minimum_participants: number | null;
  class_type: { name: string } | null;
  instructor: { name: string } | null;
};

/**
 * Runs once daily at 10:05 PM Manila time (see vercel.json) — right after
 * the booking cutoff for tomorrow's Manila-calendar-day sessions. For each
 * session with a minimum_participants set: below minimum → cancel and
 * refund everyone (system_cancel_class_session, migration 0010); at or
 * above → mark it confirmed and notify (system_confirm_class_session).
 *
 * This is a system job with no authenticated user, so it authenticates
 * itself to Vercel via CRON_SECRET (Vercel's own documented convention —
 * it sends this as a Bearer token automatically when the env var of this
 * exact name is set) and to Supabase via the service-role client, calling
 * RPCs granted ONLY to service_role, never to a logged-in admin session.
 */
export async function GET(request: Request) {
  const cronSecret = process.env.CRON_SECRET;
  const authHeader = request.headers.get("authorization");
  if (!cronSecret || authHeader !== `Bearer ${cronSecret}`) {
    return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
  }

  if (!isSupabaseConfigured || !supabaseAdmin) {
    return NextResponse.json(
      { message: "SUPABASE_SERVICE_ROLE_KEY isn't configured — this job can't run yet." },
      { status: 500 }
    );
  }

  // "Tomorrow" relative to right now, in Manila calendar-day terms — a
  // fixed 24h shift always lands on the next Manila date since Manila has
  // no DST, regardless of what time this fires at.
  const { start, end } = getManilaDayRange(new Date(Date.now() + 24 * 60 * 60 * 1000));

  const { data, error } = await supabaseAdmin
    .from("class_sessions")
    .select(
      "id, start_at, end_at, booked_count, minimum_participants, class_type:class_types(name), instructor:instructors(name)"
    )
    .eq("status", "scheduled")
    .is("attendance_checked_at", null)
    .not("minimum_participants", "is", null)
    .gte("start_at", start.toISOString())
    .lt("start_at", end.toISOString());

  if (error) {
    return NextResponse.json({ message: "Failed to load sessions." }, { status: 500 });
  }

  const sessions = (data as unknown as CandidateSession[]) ?? [];
  let cancelled = 0;
  let confirmed = 0;

  for (const session of sessions) {
    const className = session.class_type?.name ?? "Class";
    const coachName = session.instructor?.name ?? "TBA";
    const startAt = new Date(session.start_at);
    const endAt = new Date(session.end_at);
    const formattedDate = format(startAt, "MMMM d, yyyy");
    const time = format(startAt, "h:mm a");
    const endTime = format(endAt, "h:mm a");
    const arrivalTime = format(getArrivalTime(startAt), "h:mm a");

    const belowMinimum = session.booked_count < (session.minimum_participants ?? 0);

    if (belowMinimum) {
      const { data: affected } = await supabaseAdmin.rpc("system_cancel_class_session", {
        p_class_session_id: session.id,
      });
      cancelled += 1;

      const rows = (affected ?? []) as { user_id: string; remaining_credits: number }[];
      if (rows.length === 0) continue;

      const userIds = [...new Set(rows.map((row) => row.user_id))];
      const { data: profiles } = await supabaseAdmin
        .from("profiles")
        .select("id, first_name, email, mobile_number")
        .in("id", userIds);
      const profileById = new Map((profiles ?? []).map((profile) => [profile.id, profile]));

      await Promise.allSettled(
        rows.flatMap((row) => {
          const profile = profileById.get(row.user_id);
          if (!profile) return [];
          const tasks: Promise<unknown>[] = [
            sendClassCancelledByStudioEmail({
              customerFirstName: profile.first_name || "there",
              customerEmail: profile.email,
              className,
              coachName,
              formattedDate,
              time,
              packageName: "your package",
              sessionsRemaining: row.remaining_credits,
              reason: "low_enrollment",
            }),
          ];
          if (isSmsConfigured && profile.mobile_number) {
            tasks.push(
              sendSms({
                to: profile.mobile_number,
                body: `Veora Wellness: Your ${className} class on ${formattedDate} at ${time} has been cancelled due to low enrollment. Your credit has been returned.`,
              }).catch(() => undefined)
            );
          }
          return tasks;
        })
      );
    } else {
      await supabaseAdmin.rpc("system_confirm_class_session", { p_class_session_id: session.id });
      confirmed += 1;

      const { data: bookings } = await supabaseAdmin
        .from("class_bookings")
        .select("user_id")
        .eq("class_session_id", session.id)
        .eq("status", "booked");
      const userIds = [...new Set((bookings ?? []).map((booking) => booking.user_id))];
      if (userIds.length === 0) continue;

      const { data: profiles } = await supabaseAdmin
        .from("profiles")
        .select("id, first_name, email, mobile_number")
        .in("id", userIds);

      await Promise.allSettled(
        (profiles ?? []).flatMap((profile) => {
          const tasks: Promise<unknown>[] = [
            sendClassConfirmedEmail({
              customerFirstName: profile.first_name || "there",
              customerEmail: profile.email,
              className,
              coachName,
              formattedDate,
              time,
              endTime,
              arrivalTime,
              packageName: "",
            }),
          ];
          if (isSmsConfigured && profile.mobile_number) {
            tasks.push(
              sendSms({
                to: profile.mobile_number,
                body: `Veora Wellness: Your ${className} class on ${formattedDate} at ${time} is confirmed. See you there!`,
              }).catch(() => undefined)
            );
          }
          return tasks;
        })
      );
    }
  }

  return NextResponse.json({ evaluated: sessions.length, cancelled, confirmed });
}
