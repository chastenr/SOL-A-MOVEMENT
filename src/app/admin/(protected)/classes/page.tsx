import type { Metadata } from "next";
import Link from "next/link";
import { format } from "date-fns";
import { requireAdmin } from "@/lib/auth/require-role";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { Button } from "@/components/ui/Button";
import { CancelClassSessionButton } from "@/components/admin/CancelClassSessionButton";
import { DuplicateWeekForm } from "@/components/admin/DuplicateWeekForm";
import { getDisplayStatus, STATUS_STYLES } from "@/lib/class-session-status";
import { setClassSessionBookingEnabledAction } from "./actions";
import { cn } from "@/lib/utils";

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

export default async function AdminClassesPage() {
  await requireAdmin();
  const supabase = await createSupabaseServerClient();

  const { data } = await supabase
    .from("class_sessions")
    .select(
      "id, start_at, end_at, capacity, booked_count, minimum_participants, booking_enabled, status, class_type:class_types(name), location:locations(name), instructor:instructors(name)"
    )
    .order("start_at", { ascending: true })
    .limit(100);

  const sessions = (data as unknown as SessionRow[]) ?? [];

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
      <p className="mt-1 text-sm">
        <Link href="/admin/classes/time-slots" className="underline underline-offset-2 hover:text-charcoal">
          Manage which hours are open for scheduling →
        </Link>
      </p>

      <div className="mt-6 rounded-xl border border-charcoal/10 bg-ivory p-4">
        <p className="text-xs uppercase tracking-[0.1em] text-charcoal/45">Coach schedules change weekly</p>
        <div className="mt-3">
          <DuplicateWeekForm />
        </div>
      </div>

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
