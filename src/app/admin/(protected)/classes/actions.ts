"use server";

import { revalidatePath } from "next/cache";
import { addMinutes } from "date-fns";
import { requireAdmin } from "@/lib/auth/require-role";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { classSessionFormSchema, type ClassSessionFormValues } from "@/lib/validations";

type ActionResult = { error: string } | { success: true };

export async function createClassSessionAction(values: ClassSessionFormValues): Promise<ActionResult> {
  await requireAdmin();
  const parsed = classSessionFormSchema.safeParse(values);
  if (!parsed.success) return { error: parsed.error.issues[0]?.message ?? "Invalid input." };

  const startAt = new Date(parsed.data.startAt);
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
  });

  if (error) return { error: "Something went wrong. Please try again." };

  revalidatePath("/admin/classes");
  revalidatePath("/admin/calendar");
  return { success: true };
}

// Cancelling a session refunds every affected customer's credit — reuses
// admin_cancel_class_booking() per booking so each refund stays atomic and
// audited, rather than duplicating that logic here.
export async function cancelClassSessionAction(sessionId: string): Promise<void> {
  await requireAdmin();
  const supabase = await createSupabaseServerClient();

  const { data: bookings } = await supabase
    .from("class_bookings")
    .select("id")
    .eq("class_session_id", sessionId)
    .eq("status", "booked");

  for (const booking of bookings ?? []) {
    await supabase.rpc("admin_cancel_class_booking", { p_booking_id: booking.id });
  }

  const { error } = await supabase.from("class_sessions").update({ status: "cancelled" }).eq("id", sessionId);
  if (error) throw new Error("Something went wrong. Please try again.");

  revalidatePath("/admin/classes");
  revalidatePath("/admin/calendar");
  revalidatePath("/admin/bookings");
}
