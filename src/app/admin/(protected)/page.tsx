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
import { formatManilaFullDate, formatManilaTime } from "@/lib/manila-time";
import {
  ArrowRight,
  CalendarDays,
  CalendarPlus,
  CheckCircle2,
  ClipboardCheck,
  CreditCard,
  Search,
  TriangleAlert,
  UsersRound,
  type LucideIcon,
} from "lucide-react";

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

async function getTodayStats(includePaymentStats: boolean) {
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

  const [
    bookingsResult,
    todayBookings,
    customerCountResult,
    newCustomerCountResult,
    pendingPaymentResult,
    membershipAttentionResult,
    unverifiedPhoneResult,
  ] = await Promise.all([
    sessionIds.length
      ? supabase.from("class_bookings").select("status").in("class_session_id", sessionIds)
      : Promise.resolve({ data: [] as { status: string }[], error: null }),
    getAdminBookings({ from: start.toISOString(), to: end.toISOString() }),
    supabase.from("profiles").select("id", { count: "exact", head: true }).eq("role", "customer"),
    supabase.from("profiles").select("id", { count: "exact", head: true }).eq("role", "customer").gte("created_at", start.toISOString()).lt("created_at", end.toISOString()),
    includePaymentStats
      ? supabase
          .from("purchases")
          .select("id", { count: "exact", head: true })
          .in("purchase_status", ["pending_payment", "proof_submitted"])
      : Promise.resolve({ count: 0, error: null }),
    includePaymentStats
      ? supabase
          .from("customer_memberships")
          .select("id", { count: "exact", head: true })
          .in("status", ["pending_payment", "payment_verification", "past_due", "suspended"])
      : Promise.resolve({ count: 0, error: null }),
    supabase
      .from("profiles")
      .select("id", { count: "exact", head: true })
      .eq("role", "customer")
      .is("phone_verified_at", null),
  ]);
  const { data: bookings, error: bookingsError } = bookingsResult;
  if (bookingsError) console.error("[getTodayStats] class_bookings query failed", bookingsError);
  if (customerCountResult.error) console.error("[getTodayStats] customer count query failed", customerCountResult.error);
  if (newCustomerCountResult.error) console.error("[getTodayStats] new customer count query failed", newCustomerCountResult.error);
  if (pendingPaymentResult.error) console.error("[getTodayStats] pending payment count query failed", pendingPaymentResult.error);
  if (membershipAttentionResult.error) console.error("[getTodayStats] membership attention query failed", membershipAttentionResult.error);
  if (unverifiedPhoneResult.error) console.error("[getTodayStats] unverified phone count query failed", unverifiedPhoneResult.error);

  const rows = bookings ?? [];
  const now = new Date();

  // Same [start, end) Manila-day window as the query above, so "who's
  // booked today" always matches the counts above it — not two independently
  // -computed ideas of "today" drifting apart near midnight.
  const sortedTodayBookings = todayBookings.sort(
    (a, b) => new Date(a.session?.startAt ?? 0).getTime() - new Date(b.session?.startAt ?? 0).getTime()
  );
  const activeSessions = sessions.filter((session) => session.status !== "cancelled");
  const nextSession = activeSessions.find(
    (session) => session.status === "scheduled" && new Date(session.start_at) > now
  ) ?? null;

  return {
    sessions,
    todayBookings: sortedTodayBookings,
    nextSession,
    classesToday: activeSessions.length,
    peopleBooked: rows.filter((b) => b.status !== "cancelled").length,
    checkedIn: rows.filter((b) => b.status === "completed").length,
    noShows: rows.filter((b) => b.status === "no_show").length,
    upcoming: sessions.filter((s) => s.status === "scheduled" && new Date(s.start_at) > now).length,
    pendingBookings: sortedTodayBookings.filter((booking) => booking.status === "pending").length,
    belowMinimum: activeSessions.filter(
      (session) =>
        session.status === "scheduled" &&
        session.minimum_participants !== null &&
        session.booked_count < session.minimum_participants
    ).length,
    pendingPayments: pendingPaymentResult.count ?? 0,
    membershipsRequiringAttention: membershipAttentionResult.count ?? 0,
    unverifiedPhones: unverifiedPhoneResult.count ?? 0,
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

type QuickAction = {
  label: string;
  description: string;
  href: string;
  icon: LucideIcon;
};

export default async function AdminDashboardPage() {
  const admin = await requireAdmin();
  const isOwner = admin.role === "super_admin";
  const today = await getTodayStats(isOwner);
  const quickActions: QuickAction[] = [
    { label: "Add a class", description: "Create a new session", href: "/admin/classes/new", icon: CalendarPlus },
    { label: "Open calendar", description: "Manage today's schedule", href: "/admin/calendar", icon: CalendarDays },
    { label: "Find a client", description: "Search profiles and credits", href: "/admin/customers", icon: Search },
    isOwner
      ? { label: "Review payments", description: "Approve pending transfers", href: "/admin/payments", icon: CreditCard }
      : { label: "View bookings", description: "Confirm and check in", href: "/admin/bookings", icon: ClipboardCheck },
  ];
  const actionItems = [
    { label: "Pending bookings", count: today.pendingBookings, href: "/admin/bookings?status=pending" },
    ...(isOwner
      ? [
          { label: "Payments awaiting review", count: today.pendingPayments, href: "/admin/payments" },
          { label: "Memberships requiring attention", count: today.membershipsRequiringAttention, href: "/admin/memberships" },
        ]
      : []),
    { label: "Classes below minimum", count: today.belowMinimum, href: "/admin/classes" },
    { label: "Clients without verified phone", count: today.unverifiedPhones, href: "/admin/customers" },
  ];
  const actionCount = actionItems.reduce((total, item) => total + item.count, 0);
  const nextClassFill = today.nextSession
    ? Math.min(100, Math.round((today.nextSession.booked_count / Math.max(today.nextSession.capacity, 1)) * 100))
    : 0;

  return (
    <div>
      <div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="text-xs font-medium uppercase tracking-[0.16em] text-clay">Studio overview</p>
          <h1 className="font-display mt-1 text-3xl text-charcoal">Dashboard</h1>
        </div>
        <p className="text-sm text-charcoal/50">{formatManilaFullDate(new Date())}</p>
      </div>

      <section className="mt-8" aria-labelledby="quick-actions-heading">
        <div className="flex items-center justify-between gap-4">
          <h2 id="quick-actions-heading" className="text-xs font-semibold uppercase tracking-[0.15em] text-charcoal/45">
            Quick actions
          </h2>
          <span className="text-xs text-charcoal/40">Daily shortcuts</span>
        </div>
        <div className="mt-3 grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
          {quickActions.map((action) => {
            const Icon = action.icon;
            return (
              <Link
                key={action.href}
                href={action.href}
                className="group flex min-h-24 items-center gap-4 rounded-2xl border border-charcoal/10 bg-ivory p-4 transition-all hover:-translate-y-0.5 hover:border-clay/35 hover:shadow-[0_12px_30px_-22px_rgba(77,56,44,0.55)] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-clay"
              >
                <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-clay/10 text-clay transition-colors group-hover:bg-clay group-hover:text-ivory">
                  <Icon size={19} strokeWidth={1.8} aria-hidden />
                </span>
                <span className="min-w-0 flex-1">
                  <span className="block font-medium text-charcoal">{action.label}</span>
                  <span className="mt-0.5 block text-xs leading-5 text-charcoal/50">{action.description}</span>
                </span>
                <ArrowRight size={16} className="shrink-0 text-charcoal/30 transition-transform group-hover:translate-x-0.5 group-hover:text-clay" aria-hidden />
              </Link>
            );
          })}
        </div>
      </section>

      <div className="mt-8 grid gap-4 lg:grid-cols-[1.3fr_1fr]">
        <section className="rounded-2xl border border-charcoal/10 bg-ivory p-5 sm:p-6" aria-labelledby="next-class-heading">
          <div className="flex items-center justify-between gap-4">
            <div>
              <p className="text-[10px] font-semibold uppercase tracking-[0.16em] text-clay">Up next</p>
              <h2 id="next-class-heading" className="font-display mt-1 text-2xl text-charcoal">Next class</h2>
            </div>
            <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-charcoal/[0.05] text-charcoal/55">
              <CalendarDays size={19} strokeWidth={1.7} aria-hidden />
            </span>
          </div>

          {today.nextSession ? (
            <div className="mt-6">
              <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
                <div>
                  <p className="text-3xl font-medium text-charcoal">{formatManilaTime(today.nextSession.start_at)}</p>
                  <p className="font-display mt-1 text-xl text-charcoal">{today.nextSession.class_type?.name ?? "Class"}</p>
                  <p className="mt-1 text-sm text-charcoal/55">Coach {today.nextSession.instructor?.name ?? "TBA"}</p>
                </div>
                <p className="text-sm font-medium text-charcoal">
                  {Math.max(today.nextSession.capacity - today.nextSession.booked_count, 0)} / {today.nextSession.capacity} spots available
                </p>
              </div>
              <div className="mt-4 h-2 overflow-hidden rounded-full bg-charcoal/[0.07]" aria-hidden>
                <div className="h-full rounded-full bg-clay" style={{ width: `${nextClassFill}%` }} />
              </div>
              <Button href={`/admin/classes/${today.nextSession.id}`} size="md" className="mt-5">
                Open roster
              </Button>
            </div>
          ) : (
            <div className="mt-6 rounded-xl bg-charcoal/[0.035] p-4">
              <p className="text-sm text-charcoal/60">No more classes are scheduled today.</p>
              <Link href="/admin/calendar" className="mt-3 inline-flex items-center gap-1.5 text-sm font-medium text-clay hover:underline">
                Open calendar <ArrowRight size={14} aria-hidden />
              </Link>
            </div>
          )}
        </section>

        <section className="rounded-2xl border border-charcoal/10 bg-ivory p-5 sm:p-6" aria-labelledby="action-required-heading">
          <div className="flex items-start justify-between gap-4">
            <div>
              <p className="text-[10px] font-semibold uppercase tracking-[0.16em] text-clay">Priority queue</p>
              <h2 id="action-required-heading" className="font-display mt-1 text-2xl text-charcoal">Action required</h2>
            </div>
            <span className={cn(
              "flex h-10 min-w-10 items-center justify-center rounded-xl px-2 text-sm font-semibold",
              actionCount > 0 ? "bg-amber-100 text-amber-800" : "bg-emerald-100 text-emerald-700"
            )}>
              {actionCount > 0 ? actionCount : <><CheckCircle2 size={18} aria-hidden /><span className="sr-only">All clear</span></>}
            </span>
          </div>
          <div className="mt-4 divide-y divide-charcoal/[0.07]">
            {actionItems.map((item) => (
              <Link key={item.label} href={item.href} className="group flex min-h-11 items-center justify-between gap-3 py-2 text-sm">
                <span className="flex items-center gap-2.5 text-charcoal/65 transition-colors group-hover:text-charcoal">
                  {item.count > 0 ? (
                    <TriangleAlert size={15} className="text-amber-600" aria-hidden />
                  ) : (
                    <CheckCircle2 size={15} className="text-emerald-600" aria-hidden />
                  )}
                  {item.label}
                </span>
                <span className={cn(
                  "min-w-7 rounded-full px-2 text-center text-xs font-semibold leading-6",
                  item.count > 0 ? "bg-amber-100 text-amber-800" : "bg-charcoal/[0.05] text-charcoal/40"
                )}>
                  {item.count}
                </span>
              </Link>
            ))}
          </div>
        </section>
      </div>

      <p className="mt-8 text-xs font-semibold uppercase tracking-[0.15em] text-charcoal/45">Today at a glance</p>
      <div className="mt-3 grid gap-3 grid-cols-2 sm:grid-cols-3 lg:grid-cols-5">
        {STAT_CARDS.map((card) => (
          <div key={card.key} className="rounded-2xl border border-charcoal/10 bg-ivory p-4 sm:p-5">
            <p className="font-display text-3xl text-charcoal">{today[card.key]}</p>
            <p className="mt-1 text-xs uppercase tracking-[0.08em] text-charcoal/50">{card.label}</p>
          </div>
        ))}
      </div>
      <div className="mt-3 grid grid-cols-2 gap-3">
        <Link href="/admin/customers" className="rounded-2xl border border-charcoal/10 bg-ivory p-4 transition-colors hover:border-clay/35 sm:p-5">
          <div className="flex items-center justify-between gap-3">
            <div><p className="font-display text-2xl text-charcoal">{today.totalCustomers}</p><p className="mt-1 text-xs uppercase tracking-[0.08em] text-charcoal/50">Total clients</p></div>
            <UsersRound size={19} className="text-clay" aria-hidden />
          </div>
        </Link>
        <Link href="/admin/customers" className="rounded-2xl border border-charcoal/10 bg-ivory p-4 transition-colors hover:border-clay/35 sm:p-5">
          <div className="flex items-center justify-between gap-3">
            <div><p className="font-display text-2xl text-charcoal">{today.newCustomersToday}</p><p className="mt-1 text-xs uppercase tracking-[0.08em] text-charcoal/50">New clients today</p></div>
            <UsersRound size={19} className="text-clay" aria-hidden />
          </div>
        </Link>
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

    </div>
  );
}
