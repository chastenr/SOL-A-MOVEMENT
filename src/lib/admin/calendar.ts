import "server-only";
import { createSupabaseServerClient } from "@/lib/supabase/server";

export type AdminCalendarSession = {
  id: string;
  startAt: string;
  endAt: string;
  className: string;
  location: string;
  instructor: string | null;
  capacity: number;
  bookedCount: number;
  minimumParticipants: number | null;
  bookingEnabled: boolean;
  status: "scheduled" | "cancelled" | "completed";
  attendees: Array<{
    bookingId: string;
    customerName: string;
    status: "booked" | "completed" | "no_show";
  }>;
};

type RawSession = {
  id: string;
  start_at: string;
  end_at: string;
  capacity: number;
  booked_count: number;
  minimum_participants: number | null;
  booking_enabled: boolean;
  status: AdminCalendarSession["status"];
  class_type: { name: string } | null;
  location: { name: string } | null;
  instructor: { name: string } | null;
};

/**
 * Session-first admin calendar data. Empty classes remain visible with their
 * coach and capacity; active booking rows are attached as a roster instead of
 * turning every customer into a duplicate calendar event.
 */
export async function getAdminCalendarSessions(from: string, to: string): Promise<AdminCalendarSession[]> {
  const supabase = await createSupabaseServerClient();
  const { data, error } = await supabase
    .from("class_sessions")
    .select(
      "id, start_at, end_at, capacity, booked_count, minimum_participants, booking_enabled, status, class_type:class_types(name), location:locations(name), instructor:instructors(name)"
    )
    .gte("start_at", from)
    .lt("start_at", to)
    .order("start_at", { ascending: true })
    .limit(500);

  if (error || !data) return [];
  const sessions = data as unknown as RawSession[];
  const sessionIds = sessions.map((session) => session.id);
  if (sessionIds.length === 0) return [];

  const { data: bookingsData } = await supabase
    .from("class_bookings")
    .select("id, class_session_id, user_id, status")
    .in("class_session_id", sessionIds)
    .neq("status", "cancelled")
    .limit(1000);

  const bookings = (bookingsData ?? []) as Array<{
    id: string;
    class_session_id: string;
    user_id: string;
    status: "booked" | "completed" | "no_show";
  }>;
  const userIds = [...new Set(bookings.map((booking) => booking.user_id))];
  const { data: profilesData } = userIds.length
    ? await supabase.from("profiles").select("id, first_name, last_name, email").in("id", userIds)
    : { data: [] as Array<{ id: string; first_name: string; last_name: string; email: string }> };

  const profileById = new Map((profilesData ?? []).map((profile) => [profile.id, profile]));
  const bookingsBySession = new Map<string, typeof bookings>();
  for (const booking of bookings) {
    bookingsBySession.set(booking.class_session_id, [
      ...(bookingsBySession.get(booking.class_session_id) ?? []),
      booking,
    ]);
  }

  return sessions.map((session) => ({
    id: session.id,
    startAt: session.start_at,
    endAt: session.end_at,
    className: session.class_type?.name ?? "—",
    location: session.location?.name ?? "—",
    instructor: session.instructor?.name ?? null,
    capacity: session.capacity,
    bookedCount: session.booked_count,
    minimumParticipants: session.minimum_participants,
    bookingEnabled: session.booking_enabled,
    status: session.status,
    attendees: (bookingsBySession.get(session.id) ?? []).map((booking) => {
      const profile = profileById.get(booking.user_id);
      return {
        bookingId: booking.id,
        customerName: profile
          ? `${profile.first_name} ${profile.last_name}`.trim() || profile.email
          : "Customer",
        status: booking.status,
      };
    }),
  }));
}
