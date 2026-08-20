import type { Metadata } from "next";
import Link from "next/link";
import { requireAdmin } from "@/lib/auth/require-role";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { getManilaDayRange } from "@/lib/booking-cutoff";
import { getDisplayStatus, STATUS_STYLES } from "@/lib/class-session-status";
import { getAdminBookings, type AdminBookingRow } from "@/lib/admin/bookings";
import { Button } from "@/components/ui/Button";
import { SubmitButton } from "@/components/ui/SubmitButton";
import { cn } from "@/lib/utils";
import { cancelBookingAction, completeBookingAction, confirmBookingAction, noShowBookingAction } from "./bookings/actions";
import { formatManilaTime } from "@/lib/manila-time";

const BOOKING_STATUS_LABEL: Record<AdminBookingRow["status"], string> = {
  pending: "Pending",
  booked: "Confirmed",
  completed: "Completed",
  cancelled: "Cancelled",
  no_show: "No Show",
};

const BOOKING_STATUS_BADGE: Record<AdminBookingRow["status"], string> = {
  pending: "bg-amber-100 text-amber-800",
  booked: "bg-clay/10 text-clay",
  completed: "bg-emerald-100 text-emerald-700",
  cancelled: "bg-charcoal/10 text-charcoal/50",
  no_show: "bg-red-100 text-red-700",
};

export const metadata: Metadata = {
  title: "Admin Dashboard",
  robots: { index: false, follow: false },
};

type TodaySession = {
  id: string;
  start_at: string;
  end_at: string;
  capacity: number;
  booked_count: number;
  minimum_participants: number | null;
  booking_enabled: boolean;
  status: "scheduled" | "cancelled" | "completed";
  class_type: { name: string } | null;
  instructor: { name: string } | null;
};

async function getTodayStats() {
  const supabase = await createSupabaseServerClient();
  const { start, end } = getManilaDayRange();

  const { data, error } = await supabase
    .from("class_sessions")
    .select(
      "id, start_at, end_at, capacity, booked_count, minimum_participants, booking_enabled, status, class_type:class_types(name), instructor:instructors(name)"
    )
    .gte("start_at", start.toISOString())
    .lt("start_at", end.toISOString())
    .order("start_at", { ascending: true });
  if (error) console.error("[getTodayStats] class_sessions query failed", error);

  const sessions = (data as unknown as TodaySession[]) ?? [];
  const sessionIds = sessions.map((session) => session.id);

  const [bookingsResult, todayBookings, customerCountResult, newCustomerCountResult] = await Promise.all([
    sessionIds.length
      ? supabase.from("class_bookings").select("status").in("class_session_id", sessionIds)
      : Promise.resolve({ data: [] as { status: string }[], error: null }),
    getAdminBookings({ from: start.toISOString(), to: end.toISOString() }),
    supabase.from("profiles").select("id", { count: "exact", head: true }).eq("role", "customer"),
    supabase.from("profiles").select("id", { count: "exact", head: true }).eq("role", "customer").gte("created_at", start.toISOString()).lt("created_at", end.toISOString()),
  ]);
  const { data: bookings, error: bookingsError } = bookingsResult;
  if (bookingsError) console.error("[getTodayStats] class_bookings query failed", bookingsError);

  const rows = bookings ?? [];
  const now = new Date();

  // Same [start, end) Manila-day window as the query above, so "who's
  // booked today" always matches the counts above it — not two independently
  // -computed ideas of "today" drifting apart near midnight.
  const sortedTodayBookings = todayBookings.sort(
    (a, b) => new Date(a.session?.startAt ?? 0).getTime() - new Date(b.session?.startAt ?? 0).getTime()
  );

  return {
    sessions,
    todayBookings: sortedTodayBookings,
    classesToday: sessions.filter((s) => s.status !== "cancelled").length,
    peopleBooked: rows.filter((b) => b.status !== "cancelled").length,
    checkedIn: rows.filter((b) => b.status === "completed").length,
    noShows: rows.filter((b) => b.status === "no_show").length,
    upcoming: sessions.filter((s) => s.status === "scheduled" && new Date(s.start_at) > now).length,
    totalCustomers: customerCountResult.count ?? 0,
    newCustomersToday: newCustomerCountResult.count ?? 0,
  };
}

const STAT_CARDS = [
  { key: "classesToday", label: "Classes Today" },
  { key: "peopleBooked", label: "People Booked" },
  { key: "checkedIn", label: "Checked In" },
  { key: "noShows", label: "No Shows" },
  { key: "upcoming", label: "Upcoming" },
] as const;

export default async function AdminDashboardPage() {
  const admin = await requireAdmin();
  const today = await getTodayStats();

  return (
    <div>
      <h1 className="font-display text-2xl text-charcoal">Dashboard</h1>
      <p className="mt-2 text-charcoal/60">
        Signed in as {admin.email} ({admin.role}).
      </p>

      <p className="mt-8 text-xs uppercase tracking-[0.15em] text-charcoal/45">Today</p>
      <div className="mt-3 grid gap-3 sm:grid-cols-2">
        <div className="rounded-2xl border border-charcoal/10 bg-ivory p-5">
          <p className="font-display text-3xl text-charcoal">{today.totalCustomers}</p>
          <p className="mt-1 text-xs uppercase tracking-[0.08em] text-charcoal/50">Total Client Signups</p>
        </div>
        <div className="rounded-2xl border border-charcoal/10 bg-ivory p-5">
          <p className="font-display text-3xl text-charcoal">{today.newCustomersToday}</p>
          <p className="mt-1 text-xs uppercase tracking-[0.08em] text-charcoal/50">New Clients Today</p>
        </div>
      </div>
      <div className="mt-3 grid gap-3 sm:grid-cols-3 lg:grid-cols-5">
        {STAT_CARDS.map((card) => (
          <div key={card.key} className="rounded-2xl border border-charcoal/10 bg-ivory p-5">
            <p className="font-display text-3xl text-charcoal">{today[card.key]}</p>
            <p className="mt-1 text-xs uppercase tracking-[0.08em] text-charcoal/50">{card.label}</p>
          </div>
        ))}
      </div>

      <div className="mt-6">
        {today.sessions.length === 0 ? (
          <p className="text-sm text-charcoal/55">No classes scheduled today.</p>
        ) : (
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {today.sessions.map((session) => {
              const status = getDisplayStatus(session);
              return (
                <div key={session.id} className="rounded-2xl border border-charcoal/10 bg-ivory p-5">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <p className="text-xs uppercase tracking-[0.08em] text-charcoal/45">
                        {formatManilaTime(session.start_at)}
                      </p>
                      <p className="mt-1 font-display text-lg text-charcoal">
                        {session.class_type?.name ?? "—"}
                      </p>
                      <p className="text-sm text-charcoal/60">Coach {session.instructor?.name ?? "TBA"}</p>
                    </div>
                    <span
                      className={cn(
                        "shrink-0 rounded-full px-2.5 py-0.5 text-[10px] font-medium uppercase tracking-[0.08em]",
                        STATUS_STYLES[status]
                      )}
                    >
                      {status}
                    </span>
                  </div>
                  <p className="mt-3 text-sm text-charcoal/70">
                    Booked: {session.booked_count} / {session.capacity}
                    {session.minimum_participants !== null && (
                      <span className="text-charcoal/45"> · Minimum: {session.minimum_participants}</span>
                    )}
                  </p>
                  <Link
                    href={`/admin/classes/${session.id}`}
                    className="mt-3 inline-block text-xs underline underline-offset-2 hover:text-charcoal"
                  >
                    View session &amp; roster
                  </Link>
                </div>
              );
            })}
          </div>
        )}
      </div>

      <div className="mt-10 flex items-center justify-between gap-4">
        <p className="text-xs uppercase tracking-[0.15em] text-charcoal/45">Today&rsquo;s Bookings</p>
        <Link href="/admin/bookings" className="text-xs underline underline-offset-2 hover:text-charcoal">
          View all bookings
        </Link>
      </div>

      {today.todayBookings.length === 0 ? (
        <p className="mt-3 text-sm text-charcoal/55">No one is booked into a class today yet.</p>
      ) : (
        <div className="mt-3 overflow-x-auto rounded-xl border border-charcoal/10 bg-ivory">
          <table className="w-full min-w-[900px] text-left text-sm">
            <thead className="border-b border-charcoal/10 text-xs uppercase tracking-[0.08em] text-charcoal/45">
              <tr>
                <th className="px-4 py-3">Time (PHT)</th>
                <th className="px-4 py-3">Customer</th>
                <th className="px-4 py-3">Class</th>
                <th className="px-4 py-3">Coach</th>
                <th className="px-4 py-3">Status</th>
                <th className="px-4 py-3" />
              </tr>
            </thead>
            <tbody>
              {today.todayBookings.map((booking) => (
                <tr key={booking.id} className="border-b border-charcoal/5 last:border-0">
                  <td className="px-4 py-3 text-charcoal/70">
                    {booking.session ? formatManilaTime(booking.session.startAt) : "—"}
                  </td>
                  <td className="px-4 py-3">
                    <p className="text-charcoal">{booking.customer.name}</p>
                    <p className="text-xs text-charcoal/45">{booking.customer.email}</p>
                  </td>
                  <td className="px-4 py-3 text-charcoal/70">{booking.session?.className ?? "—"}</td>
                  <td className="px-4 py-3 text-charcoal/70">{booking.session?.instructor ?? "TBA"}</td>
                  <td className="px-4 py-3">
                    <span className={`rounded-full px-2.5 py-1 text-xs ${BOOKING_STATUS_BADGE[booking.status]}`}>
                      {BOOKING_STATUS_LABEL[booking.status]}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center justify-end gap-3 whitespace-nowrap">
                      {booking.status === "pending" && (
                        <form action={confirmBookingAction.bind(null, booking.id)}>
                          <SubmitButton pendingLabel="…" className="text-xs text-emerald-700 underline underline-offset-2">Confirm</SubmitButton>
                        </form>
                      )}
                      {booking.status === "booked" && (
                        <>
                          <form action={completeBookingAction.bind(null, booking.id)}>
                            <SubmitButton pendingLabel="…" className="text-xs underline underline-offset-2 hover:text-charcoal">
                              Complete
                            </SubmitButton>
                          </form>
                          <form action={noShowBookingAction.bind(null, booking.id)}>
                            <SubmitButton
                              pendingLabel="…"
                              className="text-xs text-charcoal/50 underline underline-offset-2 hover:text-red-600"
                            >
                              No Show
                            </SubmitButton>
                          </form>
                          <form action={cancelBookingAction.bind(null, booking.id)}>
                            <SubmitButton pendingLabel="…" className="text-xs text-red-600 underline underline-offset-2 hover:text-red-700">
                              Cancel
                            </SubmitButton>
                          </form>
                        </>
                      )}
                      <Link href={`/admin/bookings/${booking.id}`} className="text-xs underline underline-offset-2 hover:text-charcoal">
                        View
                      </Link>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <div className="mt-10 grid gap-4 sm:grid-cols-2">
        {admin.role === "super_admin" && <div className="rounded-2xl border border-charcoal/10 bg-ivory p-6">
          <p className="font-display text-lg text-charcoal">Packages</p>
          <p className="mt-1 text-sm text-charcoal/60">Edit pricing, credits and offers shown on /pricing.</p>
          <Button href="/admin/packages" variant="secondary" size="md" className="mt-4">
            Manage Packages
          </Button>
        </div>}
        <div className="rounded-2xl border border-charcoal/10 bg-ivory p-6">
          <p className="font-display text-lg text-charcoal">Services</p>
          <p className="mt-1 text-sm text-charcoal/60">Edit class descriptions and images shown on /services.</p>
          <Button href="/admin/services" variant="secondary" size="md" className="mt-4">
            Manage Services
          </Button>
        </div>
      </div>
    </div>
  );
}
