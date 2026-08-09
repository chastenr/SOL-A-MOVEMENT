import type { Metadata } from "next";
import { format } from "date-fns";
import { requireAdmin } from "@/lib/auth/require-role";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { getManilaDayRange } from "@/lib/booking-cutoff";
import { getDisplayStatus, STATUS_STYLES } from "@/lib/class-session-status";
import { Button } from "@/components/ui/Button";
import { cn } from "@/lib/utils";

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

  const { data } = await supabase
    .from("class_sessions")
    .select(
      "id, start_at, end_at, capacity, booked_count, minimum_participants, booking_enabled, status, class_type:class_types(name), instructor:instructors(name)"
    )
    .gte("start_at", start.toISOString())
    .lt("start_at", end.toISOString())
    .order("start_at", { ascending: true });

  const sessions = (data as unknown as TodaySession[]) ?? [];
  const sessionIds = sessions.map((session) => session.id);

  const { data: bookings } = sessionIds.length
    ? await supabase.from("class_bookings").select("status").in("class_session_id", sessionIds)
    : { data: [] as { status: string }[] };

  const rows = bookings ?? [];
  const now = new Date();

  return {
    sessions,
    classesToday: sessions.filter((s) => s.status !== "cancelled").length,
    peopleBooked: rows.filter((b) => b.status !== "cancelled").length,
    checkedIn: rows.filter((b) => b.status === "completed").length,
    noShows: rows.filter((b) => b.status === "no_show").length,
    upcoming: sessions.filter((s) => s.status === "scheduled" && new Date(s.start_at) > now).length,
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
                        {format(new Date(session.start_at), "h:mm a")}
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
                </div>
              );
            })}
          </div>
        )}
      </div>

      <div className="mt-10 grid gap-4 sm:grid-cols-2">
        <div className="rounded-2xl border border-charcoal/10 bg-ivory p-6">
          <p className="font-display text-lg text-charcoal">Packages</p>
          <p className="mt-1 text-sm text-charcoal/60">Edit pricing, credits and offers shown on /pricing.</p>
          <Button href="/admin/packages" variant="secondary" size="md" className="mt-4">
            Manage Packages
          </Button>
        </div>
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
