"use server";

import { revalidatePath } from "next/cache";
import { addMinutes, addDays, format } from "date-fns";
import { requireAdmin } from "@/lib/auth/require-role";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { classSessionFormSchema, type ClassSessionFormValues } from "@/lib/validations";
import { sendClassCancelledByStudioEmail } from "@/lib/email";
import { manilaLocalToUtc } from "@/lib/studio-hours";

type ActionResult = { error: string } | { success: true };

export async function createClassSessionAction(values: ClassSessionFormValues): Promise<ActionResult> {
  await requireAdmin();
  const parsed = classSessionFormSchema.safeParse(values);
  if (!parsed.success) return { error: parsed.error.issues[0]?.message ?? "Invalid input." };

  // manilaLocalToUtc, not `new Date(parsed.data.startAt)` — the input has
  // no timezone in it at all, and the admin types Manila wall-clock time.
  // `new Date(...)` on a bare datetime-local string is parsed as the
  // SERVER's own timezone (UTC on Vercel), which silently shifted every
  // scheduled class 8 hours from what was actually typed.
  const startAt = manilaLocalToUtc(parsed.data.startAt);
  if (Number.isNaN(startAt.getTime())) return { error: "Enter a valid start time." };
  const endAt = addMinutes(startAt, parsed.data.durationMinutes);

  const supabase = await createSupabaseServerClient();
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
      supabase.from("profiles").select("id, first_name, email").in("id", userIds),
      supabase.from("customer_packages").select("id, package_name_snapshot").in("id", packageIds),
    ]);
    const profileById = new Map((profiles ?? []).map((profile) => [profile.id, profile]));
    const packageNameById = new Map((packages ?? []).map((pkg) => [pkg.id, pkg.package_name_snapshot]));

    await Promise.allSettled(
      rows.map((row) => {
        const profile = profileById.get(row.user_id);
        if (!profile) return Promise.resolve();
        return sendClassCancelledByStudioEmail({
          customerFirstName: profile.first_name || "there",
          customerEmail: profile.email,
          className,
          coachName,
          formattedDate,
          time,
          packageName: packageNameById.get(row.customer_package_id) ?? "your package",
          sessionsRemaining: row.remaining_credits,
        });
      })
    );
  }

  revalidatePath("/admin/classes");
  revalidatePath("/admin/calendar");
  revalidatePath("/admin/bookings");
  return { success: true, refundedCount: rows.length };
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
