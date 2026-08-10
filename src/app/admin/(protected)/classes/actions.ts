"use server";

import { revalidatePath } from "next/cache";
import { addMinutes, addDays, format } from "date-fns";
import { requireAdmin } from "@/lib/auth/require-role";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { classSessionFormSchema, type ClassSessionFormValues } from "@/lib/validations";
import { sendClassCancelledByStudioEmail } from "@/lib/email";
import { isSmsConfigured, sendSms } from "@/lib/sms";
import { CLASS_DURATION_MINUTES, getMinutesSinceMidnight, manilaLocalToUtc } from "@/lib/studio-hours";

type ActionResult = { error: string } | { success: true };
type SupabaseServerClient = Awaited<ReturnType<typeof createSupabaseServerClient>>;

const BALLET_SERVICE_SLUG = "ballet";

/**
 * Every class type except Ballet is locked to the 50-minute, on-the-hour
 * schedule managed in the Class Times section on this page — the client already
 * enforces this in the form, but neither create nor update can trust that
 * payload (same reasoning as the studio-hours/booking-cutoff checks
 * elsewhere in this app), so this re-derives the duration and re-checks the
 * hour against class_time_slots itself. Ballet keeps its free-typed start
 * time + duration (60/90 min) untouched. Shared by create and update so the
 * two paths can't drift apart.
 */
async function resolveDurationMinutes(
  supabase: SupabaseServerClient,
  classTypeId: string,
  locationId: string,
  startAt: string,
  requestedDurationMinutes: number
): Promise<{ durationMinutes: number } | { error: string }> {
  const { data: classType } = await supabase
    .from("class_types")
    .select("service_slug")
    .eq("id", classTypeId)
    .single();

  if (classType?.service_slug === BALLET_SERVICE_SLUG) {
    return { durationMinutes: requestedDurationMinutes };
  }

  const minutesSinceMidnight = getMinutesSinceMidnight(startAt);
  if (minutesSinceMidnight === null || minutesSinceMidnight % 60 !== 0) {
    return { error: "Pick one of the open hourly time slots." };
  }
  const { data: slot } = await supabase
    .from("class_time_slots")
    .select("id")
    .eq("location_id", locationId)
    .eq("hour", Math.floor(minutesSinceMidnight / 60))
    .eq("is_active", true)
    .maybeSingle();
  if (!slot) return { error: "That time isn't open for this location. Pick another hour." };
  return { durationMinutes: CLASS_DURATION_MINUTES };
}

export async function createClassSessionAction(values: ClassSessionFormValues): Promise<ActionResult> {
  await requireAdmin();
  const parsed = classSessionFormSchema.safeParse(values);
  if (!parsed.success) return { error: parsed.error.issues[0]?.message ?? "Invalid input." };

  const supabase = await createSupabaseServerClient();
  const resolved = await resolveDurationMinutes(
    supabase,
    parsed.data.classTypeId,
    parsed.data.locationId,
    parsed.data.startAt,
    parsed.data.durationMinutes
  );
  if ("error" in resolved) return resolved;

  // manilaLocalToUtc, not `new Date(parsed.data.startAt)` — the input has
  // no timezone in it at all, and the admin types Manila wall-clock time.
  // `new Date(...)` on a bare datetime-local string is parsed as the
  // SERVER's own timezone (UTC on Vercel), which silently shifted every
  // scheduled class 8 hours from what was actually typed.
  const startAt = manilaLocalToUtc(parsed.data.startAt);
  if (Number.isNaN(startAt.getTime())) return { error: "Enter a valid start time." };
  const endAt = addMinutes(startAt, resolved.durationMinutes);

  const { error } = await supabase.from("class_sessions").insert({
    class_type_id: parsed.data.classTypeId,
    location_id: parsed.data.locationId,
    instructor_id: parsed.data.instructorId || null,
    start_at: startAt.toISOString(),
    end_at: endAt.toISOString(),
    capacity: parsed.data.capacity,
    minimum_participants: parsed.data.minimumParticipants || null,
  });

  if (error) return { error: "Something went wrong. Please try again." };

  revalidatePath("/admin/classes");
  revalidatePath("/admin/calendar");
  return { success: true };
}

/**
 * Edits an existing, still-scheduled session in place — coach, capacity,
 * minimum, and (for fixed-schedule class types) date/hour. There's no
 * customer notification here: unlike cancelling, editing doesn't refund or
 * un-book anyone, so the admin UI surfaces a plain warning instead when
 * people are already booked (see ClassSessionForm).
 */
export async function updateClassSessionAction(
  sessionId: string,
  values: ClassSessionFormValues
): Promise<ActionResult> {
  await requireAdmin();
  const parsed = classSessionFormSchema.safeParse(values);
  if (!parsed.success) return { error: parsed.error.issues[0]?.message ?? "Invalid input." };

  const supabase = await createSupabaseServerClient();

  const { data: existing } = await supabase
    .from("class_sessions")
    .select("booked_count, status")
    .eq("id", sessionId)
    .single();
  if (!existing) return { error: "That class session could not be found." };
  if (existing.status !== "scheduled") return { error: "Only scheduled sessions can be edited." };
  if (parsed.data.capacity < existing.booked_count) {
    return { error: `Capacity can't be less than the ${existing.booked_count} customers already booked.` };
  }

  const resolved = await resolveDurationMinutes(
    supabase,
    parsed.data.classTypeId,
    parsed.data.locationId,
    parsed.data.startAt,
    parsed.data.durationMinutes
  );
  if ("error" in resolved) return resolved;

  const startAt = manilaLocalToUtc(parsed.data.startAt);
  if (Number.isNaN(startAt.getTime())) return { error: "Enter a valid start time." };
  const endAt = addMinutes(startAt, resolved.durationMinutes);

  const { error } = await supabase
    .from("class_sessions")
    .update({
      class_type_id: parsed.data.classTypeId,
      location_id: parsed.data.locationId,
      instructor_id: parsed.data.instructorId || null,
      start_at: startAt.toISOString(),
      end_at: endAt.toISOString(),
      capacity: parsed.data.capacity,
      minimum_participants: parsed.data.minimumParticipants || null,
    })
    .eq("id", sessionId);

  if (error) return { error: "Something went wrong. Please try again." };

  revalidatePath("/admin/classes");
  revalidatePath(`/admin/classes/${sessionId}`);
  revalidatePath("/admin/calendar");
  return { success: true };
}

/**
 * Pauses/resumes NEW bookings on a session without cancelling it — distinct
 * from cancelClassSessionAction, which ends the class and refunds everyone.
 * Existing bookings are untouched either way (migration 0013).
 */
export async function setClassSessionBookingEnabledAction(id: string, enabled: boolean): Promise<void> {
  await requireAdmin();
  const supabase = await createSupabaseServerClient();
  const { error } = await supabase.from("class_sessions").update({ booking_enabled: enabled }).eq("id", id);
  if (error) throw new Error("Something went wrong.");

  revalidatePath("/admin/classes");
  revalidatePath("/admin/calendar");
  revalidatePath("/account/book");
  revalidatePath("/schedule");
}

export type CancelClassSessionResult =
  | { error: string }
  | { success: true; refundedCount: number };

/**
 * Cancelling a session refunds every affected customer's credit and emails
 * each one — all inside a single Postgres transaction via
 * admin_cancel_class_session() (migration 0008), not a loop of separate
 * per-booking RPC calls (each of which used to be its own transaction — a
 * crash mid-loop could leave some customers refunded and others not).
 */
export async function cancelClassSessionAction(sessionId: string): Promise<CancelClassSessionResult> {
  await requireAdmin();
  const supabase = await createSupabaseServerClient();

  const { data: session } = await supabase
    .from("class_sessions")
    .select("start_at, class_type:class_types(name), instructor:instructors(name)")
    .eq("id", sessionId)
    .single();

  const { data: affected, error } = await supabase.rpc("admin_cancel_class_session", {
    p_class_session_id: sessionId,
  });

  if (error) return { error: error.message || "Something went wrong. Please try again." };

  const rows = (affected ?? []) as {
    user_id: string;
    customer_package_id: string;
    remaining_credits: number;
  }[];

  if (rows.length > 0 && session) {
    const className = (session.class_type as unknown as { name: string } | null)?.name ?? "Class";
    const coachName = (session.instructor as unknown as { name: string } | null)?.name ?? "TBA";
    const startAt = new Date(session.start_at);
    const formattedDate = format(startAt, "MMMM d, yyyy");
    const time = format(startAt, "h:mm a");

    const userIds = [...new Set(rows.map((row) => row.user_id))];
    const packageIds = [...new Set(rows.map((row) => row.customer_package_id))];
    const [{ data: profiles }, { data: packages }] = await Promise.all([
      supabase.from("profiles").select("id, first_name, email, mobile_number").in("id", userIds),
      supabase.from("customer_packages").select("id, package_name_snapshot").in("id", packageIds),
    ]);
    const profileById = new Map((profiles ?? []).map((profile) => [profile.id, profile]));
    const packageNameById = new Map((packages ?? []).map((pkg) => [pkg.id, pkg.package_name_snapshot]));

    await Promise.allSettled(
      rows.flatMap((row) => {
        const profile = profileById.get(row.user_id);
        if (!profile) return [];
        const notifications: Promise<unknown>[] = [
          sendClassCancelledByStudioEmail({
            customerFirstName: profile.first_name || "there",
            customerEmail: profile.email,
            className,
            coachName,
            formattedDate,
            time,
            packageName: packageNameById.get(row.customer_package_id) ?? "your package",
            sessionsRemaining: row.remaining_credits,
          }),
        ];
        if (isSmsConfigured && profile.mobile_number) {
          notifications.push(
            sendSms({
              to: profile.mobile_number,
              body: `Veora Wellness: Your ${className} class on ${formattedDate} at ${time} was cancelled. Your credit has been returned.`,
            })
          );
        }
        return notifications;
      })
    );
  }

  revalidatePath("/admin/classes");
  revalidatePath("/admin/calendar");
  revalidatePath("/admin/bookings");
  return { success: true, refundedCount: rows.length };
}

// Moved here from the now-removed /admin/classes/time-slots page — Class
// Times lives as a section on this same page now, not a separate tab, so
// its one action lives with the rest of this page's actions too. Plain
// <form action={...}> handler (no client-side error UI) — failures throw
// rather than returning a value, same convention as setServiceActiveAction.
export async function setClassTimeSlotActiveAction(id: string, isActive: boolean): Promise<void> {
  await requireAdmin();
  const supabase = await createSupabaseServerClient();
  const { error } = await supabase.from("class_time_slots").update({ is_active: isActive }).eq("id", id);
  if (error) throw new Error("Something went wrong.");

  revalidatePath("/admin/classes");
  revalidatePath("/admin/classes/new");
  revalidatePath("/admin/calendar");
}

export type ClassTimeSlotTemplateValues = {
  classTypeId: string | null;
  instructorId: string | null;
  capacity: number;
  minimumParticipants: number | null;
};

/**
 * Assigns (or clears) what recurs at this hour — which class type, coach,
 * capacity, minimum. A slot with a class type set is what
 * generate_recurring_class_sessions() (migration 0015) turns into real,
 * bookable sessions going forward; clearing it back to "— None —" stops new
 * ones from being generated (existing ones are untouched either way).
 */
export async function setClassTimeSlotTemplateAction(
  id: string,
  values: ClassTimeSlotTemplateValues
): Promise<ActionResult> {
  await requireAdmin();
  if (!Number.isInteger(values.capacity) || values.capacity < 1) {
    return { error: "Capacity must be at least 1." };
  }
  if (values.minimumParticipants !== null && values.minimumParticipants > values.capacity) {
    return { error: "Minimum can't be greater than capacity." };
  }

  const supabase = await createSupabaseServerClient();
  const { error } = await supabase
    .from("class_time_slots")
    .update({
      class_type_id: values.classTypeId,
      instructor_id: values.instructorId,
      capacity: values.capacity,
      minimum_participants: values.minimumParticipants,
    })
    .eq("id", id);
  if (error) return { error: "Something went wrong. Please try again." };

  // Generate right away for this slot rather than making the admin wait
  // for the next 1 AM Manila cron run to see anything appear.
  if (values.classTypeId) {
    await supabase.rpc("generate_recurring_class_sessions", { p_days_ahead: 14 });
  }

  revalidatePath("/admin/classes");
  revalidatePath("/admin/classes/new");
  revalidatePath("/admin/calendar");
  revalidatePath("/account/book");
  revalidatePath("/schedule");
  return { success: true };
}

export type GenerateSessionsResult = { error: string } | { success: true; created: number };

/** Manual "Generate Now" trigger — same function the daily cron calls. */
export async function generateRecurringSessionsAction(): Promise<GenerateSessionsResult> {
  await requireAdmin();
  const supabase = await createSupabaseServerClient();
  const { data, error } = await supabase.rpc("generate_recurring_class_sessions", { p_days_ahead: 14 });
  if (error) return { error: "Something went wrong. Please try again." };

  revalidatePath("/admin/classes");
  revalidatePath("/admin/calendar");
  revalidatePath("/account/book");
  revalidatePath("/schedule");
  return { success: true, created: (data as number) ?? 0 };
}

/**
 * Copies every 'scheduled' session in the given week to the following
 * week, same class/location/instructor/time-of-day/capacity/minimum,
 * shifted +7 days — admin edits individual sessions afterward rather than
 * rebuilding the whole week from scratch. Coach schedules change weekly by
 * design, so this is a starting point, not a recurring-schedule engine.
 */
export async function duplicateWeekAction(weekStartIso: string): Promise<ActionResult> {
  await requireAdmin();
  const supabase = await createSupabaseServerClient();

  const weekStart = new Date(weekStartIso);
  if (Number.isNaN(weekStart.getTime())) return { error: "Invalid week." };
  const weekEnd = addDays(weekStart, 7);

  const { data: sessions, error: fetchError } = await supabase
    .from("class_sessions")
    .select("class_type_id, location_id, instructor_id, start_at, end_at, capacity, minimum_participants")
    .eq("status", "scheduled")
    .gte("start_at", weekStart.toISOString())
    .lt("start_at", weekEnd.toISOString());

  if (fetchError) return { error: "Something went wrong. Please try again." };
  if (!sessions || sessions.length === 0) return { error: "No sessions found in that week to duplicate." };

  const rows = sessions.map((session) => ({
    class_type_id: session.class_type_id,
    location_id: session.location_id,
    instructor_id: session.instructor_id,
    start_at: addDays(new Date(session.start_at), 7).toISOString(),
    end_at: addDays(new Date(session.end_at), 7).toISOString(),
    capacity: session.capacity,
    minimum_participants: session.minimum_participants,
  }));

  const { error: insertError } = await supabase.from("class_sessions").insert(rows);
  if (insertError) return { error: "Something went wrong. Please try again." };

  revalidatePath("/admin/classes");
  revalidatePath("/admin/calendar");
  return { success: true };
}
