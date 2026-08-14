import { isPastBookingCutoff } from "@/lib/booking-cutoff";

export type ClassSessionStatusInput = {
  status: "scheduled" | "cancelled" | "completed";
  start_at: string;
  end_at: string;
  booked_count: number;
  capacity: number;
  minimum_participants: number | null;
  booking_enabled: boolean;
};

export type DisplayStatus = "OPEN" | "FULL" | "NEEDS ATTENTION" | "CANCELLED" | "COMPLETED" | "BOOKING CLOSED";

export const STATUS_STYLES: Record<DisplayStatus, string> = {
  OPEN: "bg-emerald-50 text-emerald-700",
  FULL: "bg-charcoal/10 text-charcoal/70",
  "NEEDS ATTENTION": "bg-amber-50 text-amber-700",
  CANCELLED: "bg-red-50 text-red-600",
  COMPLETED: "bg-charcoal/10 text-charcoal/50",
  "BOOKING CLOSED": "bg-charcoal/10 text-charcoal/60",
};

/**
 * "Needs Attention" surfaces a session that's past the 10 PM cutoff and
 * still hasn't hit its minimum-participant floor — a human still decides
 * whether to actually cancel it (see admin_cancel_class_session,
 * migration 0008); this is a display hint, not an automatic cancellation.
 *
 * "Booking Closed" is distinct from "Cancelled" — the class still runs,
 * an admin has just paused new reservations (booking_enabled, migration
 * 0013). It's checked ahead of "Full"/"Open" since it's a deliberate admin
 * choice, not a side effect of capacity.
 */
export function getDisplayStatus(session: ClassSessionStatusInput, now = new Date()): DisplayStatus {
  if (session.status === "cancelled") return "CANCELLED";
  if (session.status === "completed") return "COMPLETED";
  // The nightly database job persists this state. This time-based fallback
  // prevents a class that has already ended from looking open while the next
  // job run is still pending.
  if (new Date(session.end_at) <= now) return "COMPLETED";
  if (
    session.minimum_participants !== null &&
    session.booked_count < session.minimum_participants &&
    isPastBookingCutoff(new Date(session.start_at), now)
  ) {
    return "NEEDS ATTENTION";
  }
  if (!session.booking_enabled) return "BOOKING CLOSED";
  if (session.booked_count >= session.capacity) return "FULL";
  return "OPEN";
}
