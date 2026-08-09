import { isPastBookingCutoff } from "@/lib/booking-cutoff";

export type ClassSessionStatusInput = {
  status: "scheduled" | "cancelled" | "completed";
  start_at: string;
  booked_count: number;
  capacity: number;
  minimum_participants: number | null;
};

export type DisplayStatus = "OPEN" | "FULL" | "NEEDS ATTENTION" | "CANCELLED" | "COMPLETED";

export const STATUS_STYLES: Record<DisplayStatus, string> = {
  OPEN: "bg-emerald-50 text-emerald-700",
  FULL: "bg-charcoal/10 text-charcoal/70",
  "NEEDS ATTENTION": "bg-amber-50 text-amber-700",
  CANCELLED: "bg-red-50 text-red-600",
  COMPLETED: "bg-charcoal/10 text-charcoal/50",
};

/**
 * "Needs Attention" surfaces a session that's past the 10 PM cutoff and
 * still hasn't hit its minimum-participant floor — a human still decides
 * whether to actually cancel it (see admin_cancel_class_session,
 * migration 0008); this is a display hint, not an automatic cancellation.
 */
export function getDisplayStatus(session: ClassSessionStatusInput): DisplayStatus {
  if (session.status === "cancelled") return "CANCELLED";
  if (session.status === "completed") return "COMPLETED";
  if (
    session.minimum_participants !== null &&
    session.booked_count < session.minimum_participants &&
    isPastBookingCutoff(new Date(session.start_at))
  ) {
    return "NEEDS ATTENTION";
  }
  if (session.booked_count >= session.capacity) return "FULL";
  return "OPEN";
}
