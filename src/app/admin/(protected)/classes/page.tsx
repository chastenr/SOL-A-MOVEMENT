import type { Metadata } from "next";
import Link from "next/link";
import { format } from "date-fns";
import { requireAdmin } from "@/lib/auth/require-role";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { Button } from "@/components/ui/Button";
import { CancelClassSessionButton } from "@/components/admin/CancelClassSessionButton";
import { DuplicateWeekForm } from "@/components/admin/DuplicateWeekForm";
import { getDisplayStatus, STATUS_STYLES } from "@/lib/class-session-status";
import { ClassTimeSlotRow } from "@/components/admin/ClassTimeSlotRow";
import { GenerateSessionsButton } from "@/components/admin/GenerateSessionsButton";
import { setClassSessionBookingEnabledAction } from "./actions";
import { cn } from "@/lib/utils";

const BALLET_SERVICE_SLUG = "ballet";

export const metadata: Metadata = {
  title: "Classes",
  robots: { index: false, follow: false },
};

type SessionRow = {
  id: string;
  start_at: string;
  end_at: string;
  capacity: number;
  booked_count: number;
  minimum_participants: number | null;
  booking_enabled: boolean;
  status: "scheduled" | "cancelled" | "completed";
  class_type: { name: string } | null;
  location: { name: string } | null;
  instructor: { name: string } | null;
};

type SlotRow = {
  id: string;
  hour: number;
  is_active: boolean;
  class_type_id: string | null;
  instructor_id: string | null;
  capacity: number;
  minimum_participants: number | null;
  location: { name: string } | null;
};

export default async function AdminClassesPage() {
  await requireAdmin();
  const supabase = await createSupabaseServerClient();

  // Fetched together (not one-then-the-other) so combining these two
  // formerly-separate pages into one doesn't turn into two sequential
  // round-trips instead of one.
  const [{ data }, { data: slotsData }, { data: classTypesData }, { data: instructorsData }] = await Promise.all([
    supabase
      .from("class_sessions")
      .select(
        "id, start_at, end_at, capacity, booked_count, minimum_participants, booking_enabled, status, class_type:class_types(name), location:locations(name), instructor:instructors(name)"
      )
      .order("start_at", { ascending: true })
      .limit(100),
    supabase
      .from("class_time_slots")
      .select("id, hour, is_active, class_type_id, instructor_id, capacity, minimum_participants, location:locations(name)")
      .order("hour"),
    // Ballet excluded — it isn't part of the hourly recurring grid (see
    // migration 0012), so it's not a valid choice for a Class Times slot.
    supabase.from("class_types").select("id, name, service_slug").eq("active", true).neq("service_slug", BALLET_SERVICE_SLUG).order("name"),
    supabase.from("instructors").select("id, name").eq("active", true).order("name"),
  ]);

  const sessions = (data as unknown as SessionRow[]) ?? [];
  const classTypeOptions = (classTypesData ?? []).map((row) => ({ id: row.id, name: row.name }));
  const instructorOptions = instructorsData ?? [];

  const slots = ((slotsData as unknown as SlotRow[] | null) ?? []).slice();
  const slotsByLocation = new Map<string, SlotRow[]>();
  for (const slot of slots) {
    const locationName = slot.location?.name ?? "—";
    slotsByLocation.set(locationName, [...(slotsByLocation.get(locationName) ?? []), slot]);
  }

  return (
    <div>
      <div className="flex items-center justify-between gap-4">
        <h1 className="font-display text-2xl text-charcoal">Classes</h1>
        <Button href="/admin/classes/new">Schedule Session</Button>
      </div>
      <p className="mt-1 text-sm text-charcoal/55">
        Real, bookable class sessions — customers redeem package credits against these on{" "}
        <code>/account/book</code>. &quot;Needs Attention&quot; means the booking cutoff has passed and the
        class is still below its minimum — review and cancel if it won&apos;t run.
      </p>

      <div className="mt-6 rounded-xl border border-charcoal/10 bg-ivory p-4">
        <p className="text-xs uppercase tracking-[0.1em] text-charcoal/45">Coach schedules change weekly</p>
        <div className="mt-3">
          <DuplicateWeekForm />
        </div>
      </div>

      <details className="mt-4 group rounded-xl border border-charcoal/10 bg-ivory">
        <summary className="cursor-pointer list-none px-4 py-3 text-sm font-medium text-charcoal marker:content-none">
          <span className="inline-flex items-center gap-2">
            Class Times
            <span className="text-xs font-normal text-charcoal/45 group-open:hidden">
              — which hours are open for scheduling
            </span>
          </span>
        </summary>
        <div className="border-t border-charcoal/10 px-4 py-4">
          <p className="text-xs text-charcoal/50">
            Hourly start times for Mat Pilates, Yoga, Barre and Strength &amp; HIIT — each fixed at 50
            minutes. Assign a class (and optionally a coach, capacity, minimum) to an hour and it repeats
            automatically every day — a nightly job keeps the next 14 days generated, so no one has to
            hand-schedule the same hour over and over. Leave it &ldquo;— None —&rdquo; for an hour you only
            want to schedule into one-off. Ballet isn&rsquo;t affected — those classes are 60/90 minutes with
            their own start time, set individually via Schedule Session.
          </p>

          <div className="mt-3">
            <GenerateSessionsButton />
          </div>

          {slotsByLocation.size === 0 ? (
            <p className="mt-4 text-sm text-charcoal/60">No locations found to schedule class times for yet.</p>
          ) : (
            [...slotsByLocation.entries()].map(([locationName, locationSlots]) => (
              <div key={locationName} className="mt-4 overflow-hidden rounded-lg border border-charcoal/10">
                <div className="border-b border-charcoal/10 bg-cream/40 px-3 py-2">
                  <p className="text-xs font-medium text-charcoal">{locationName}</p>
                </div>
                <div className="overflow-x-auto">
                  <table className="w-full min-w-[720px] text-left text-sm">
                    <thead className="border-b border-charcoal/10 text-xs uppercase tracking-[0.06em] text-charcoal/40">
                      <tr>
                        <th className="px-3 py-2">Hour</th>
                        <th className="px-3 py-2">Status</th>
                        <th className="px-3 py-2">Class</th>
                        <th className="px-3 py-2">Coach</th>
                        <th className="px-3 py-2">Capacity</th>
                        <th className="px-3 py-2">Min</th>
                        <th className="px-3 py-2" />
                      </tr>
                    </thead>
                    <tbody>
                      {locationSlots.map((slot) => (
                        <ClassTimeSlotRow
                          key={slot.id}
                          slot={{
                            id: slot.id,
                            hour: slot.hour,
                            isActive: slot.is_active,
                            classTypeId: slot.class_type_id,
                            instructorId: slot.instructor_id,
                            capacity: slot.capacity,
                            minimumParticipants: slot.minimum_participants,
                          }}
                          classTypes={classTypeOptions}
                          instructors={instructorOptions}
                        />
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            ))
          )}
        </div>
      </details>

      {sessions.length === 0 ? (
        <p className="mt-8 text-charcoal/60">
          No class sessions scheduled yet. Schedule one above to make it bookable.
        </p>
      ) : (
        <div className="mt-6 overflow-x-auto rounded-xl border border-charcoal/10 bg-ivory">
          <table className="w-full min-w-[860px] text-left text-sm">
            <thead className="border-b border-charcoal/10 text-xs uppercase tracking-[0.08em] text-charcoal/45">
              <tr>
                <th className="px-4 py-3">Class</th>
                <th className="px-4 py-3">Location</th>
                <th className="px-4 py-3">Coach</th>
                <th className="px-4 py-3">Date &amp; Time</th>
                <th className="px-4 py-3">Booked</th>
                <th className="px-4 py-3">Minimum</th>
                <th className="px-4 py-3">Status</th>
                <th className="px-4 py-3" />
              </tr>
            </thead>
            <tbody>
              {sessions.map((session) => {
                const status = getDisplayStatus(session);
                return (
                  <tr key={session.id} className="border-b border-charcoal/5 last:border-0">
                    <td className="px-4 py-3 text-charcoal">{session.class_type?.name ?? "—"}</td>
                    <td className="px-4 py-3 text-charcoal/70">{session.location?.name ?? "—"}</td>
                    <td className="px-4 py-3 text-charcoal/70">{session.instructor?.name ?? "—"}</td>
                    <td className="px-4 py-3 text-charcoal/70">
                      {format(new Date(session.start_at), "MMM d, yyyy · h:mm a")}
                    </td>
                    <td className="px-4 py-3 text-charcoal/70">
                      {session.booked_count} / {session.capacity}
                    </td>
                    <td className="px-4 py-3 text-charcoal/70">{session.minimum_participants ?? "—"}</td>
                    <td className="px-4 py-3">
                      <span
                        className={cn(
                          "rounded-full px-2.5 py-0.5 text-[10px] font-medium uppercase tracking-[0.08em]",
                          STATUS_STYLES[status]
                        )}
                      >
                        {status}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center justify-end gap-3 whitespace-nowrap">
                        {session.status === "scheduled" && (
                          <>
                            <Link
                              href={`/admin/classes/${session.id}`}
                              className="text-xs underline underline-offset-2 hover:text-charcoal"
                            >
                              Edit
                            </Link>
                            <form
                              action={setClassSessionBookingEnabledAction.bind(
                                null,
                                session.id,
                                !session.booking_enabled
                              )}
                            >
                              <button type="submit" className="text-xs underline underline-offset-2 hover:text-charcoal">
                                {session.booking_enabled ? "Close Booking" : "Open Booking"}
                              </button>
                            </form>
                            <CancelClassSessionButton sessionId={session.id} bookedCount={session.booked_count} />
                          </>
                        )}
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
