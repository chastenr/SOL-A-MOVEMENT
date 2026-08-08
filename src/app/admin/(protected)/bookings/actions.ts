"use server";

import { revalidatePath } from "next/cache";
import { requireAdmin } from "@/lib/auth/require-role";
import { createSupabaseServerClient } from "@/lib/supabase/server";

// Used as plain `<form action={...}>` handlers (no client-side error UI),
// so failures throw rather than returning a value — Next.js surfaces an
// uncaught Server Action error via the nearest error boundary. Matches the
// same convention as setPackageActiveAction/setServiceActiveAction.
async function callBookingRpc(fnName: string, bookingId: string): Promise<void> {
  await requireAdmin();
  const supabase = await createSupabaseServerClient();
  const { error } = await supabase.rpc(fnName, { p_booking_id: bookingId });

  if (error) throw new Error(error.message || "Something went wrong. Please try again.");

  revalidatePath("/admin/bookings");
  revalidatePath(`/admin/bookings/${bookingId}`);
  revalidatePath("/admin/calendar");
}

// Refunds the credit and frees the session slot — see
// admin_cancel_class_booking() in migration 0004.
export async function cancelBookingAction(bookingId: string): Promise<void> {
  return callBookingRpc("admin_cancel_class_booking", bookingId);
}

export async function completeBookingAction(bookingId: string): Promise<void> {
  return callBookingRpc("admin_complete_class_booking", bookingId);
}

// No credit refund — a no-show forfeits the credit per the site's published
// cancellation policy.
export async function noShowBookingAction(bookingId: string): Promise<void> {
  return callBookingRpc("admin_mark_class_booking_no_show", bookingId);
}
