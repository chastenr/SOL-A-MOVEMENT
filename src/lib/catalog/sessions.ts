import "server-only";
import { createSupabaseServerClient } from "@/lib/supabase/server";

export type UpcomingSessionRow = {
  id: string;
  startAt: string;
  endAt: string;
  className: string;
  serviceSlug: string;
  level: string;
  location: string;
  instructor: string | null;
  instructorPhotoUrl: string | null;
  instructorBio: string | null;
  classDescription: string;
  capacity: number;
  bookedCount: number;
  bookingEnabled: boolean;
  status: "scheduled" | "cancelled";
};

type RawSession = {
  id: string;
  start_at: string;
  end_at: string;
  capacity: number;
  booked_count: number;
  booking_enabled: boolean;
  status: "scheduled" | "cancelled";
  class_type: { name: string; service_slug: string; level: string; description: string } | null;
  location: { name: string } | null;
  instructor: { name: string; photo_url: string | null; bio: string | null } | null;
};

/**
 * Public, unauthenticated view of upcoming scheduled sessions — matches
 * the "class_sessions_select_public" RLS policy (status = 'scheduled'
 * only). Used on /schedule to show real availability once the studio
 * starts scheduling; booking itself still requires an account and package
 * credits (see /account/book).
 */
export async function getUpcomingSessions(limit = 12): Promise<UpcomingSessionRow[]> {
  const supabase = await createSupabaseServerClient();
  const { data, error } = await supabase
    .from("class_sessions")
    .select(
      "id, start_at, end_at, capacity, booked_count, booking_enabled, status, class_type:class_types(name, service_slug, level, description), location:locations(name), instructor:instructors(name, photo_url, bio)"
    )
    .in("status", ["scheduled", "cancelled"])
    .gt("start_at", new Date().toISOString())
    .order("start_at", { ascending: true })
    .limit(limit);

  if (error) {
    console.error("[getUpcomingSessions] class sessions query failed", error);
    return [];
  }

  const rows = (data as unknown as RawSession[]) ?? [];
  return rows.map((row) => ({
    id: row.id,
    startAt: row.start_at,
    endAt: row.end_at,
    className: row.class_type?.name ?? "—",
    serviceSlug: row.class_type?.service_slug ?? "",
    level: row.class_type?.level ?? "All Levels",
    location: row.location?.name ?? "—",
    instructor: row.instructor?.name ?? null,
    instructorPhotoUrl: row.instructor?.photo_url ?? null,
    instructorBio: row.instructor?.bio ?? null,
    classDescription: row.class_type?.description ?? "",
    capacity: row.capacity,
    bookedCount: row.booked_count,
    bookingEnabled: row.booking_enabled,
    status: row.status,
  }));
}
