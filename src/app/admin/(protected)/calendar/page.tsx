import type { Metadata } from "next";
import Link from "next/link";
import {
  startOfMonth,
  endOfMonth,
  startOfWeek,
  endOfWeek,
  startOfDay,
  endOfDay,
  eachDayOfInterval,
  format,
  addMonths,
  addWeeks,
  addDays,
  isSameDay,
  isSameMonth,
  parseISO,
} from "date-fns";
import { requireAdmin } from "@/lib/auth/require-role";
import { getAdminBookings, type AdminBookingRow } from "@/lib/admin/bookings";
import { cn } from "@/lib/utils";

export const metadata: Metadata = {
  title: "Calendar",
  robots: { index: false, follow: false },
};

type ViewMode = "month" | "week" | "day";

function parseAnchorDate(value: string | undefined): Date {
  if (!value) return new Date();
  try {
    const parsed = parseISO(value);
    return Number.isNaN(parsed.getTime()) ? new Date() : parsed;
  } catch {
    return new Date();
  }
}

function rangeFor(view: ViewMode, anchor: Date): { from: Date; to: Date } {
  if (view === "day") return { from: startOfDay(anchor), to: endOfDay(anchor) };
  if (view === "week") return { from: startOfWeek(anchor), to: endOfWeek(anchor) };
  return { from: startOfWeek(startOfMonth(anchor)), to: endOfWeek(endOfMonth(anchor)) };
}

function shiftAnchor(view: ViewMode, anchor: Date, direction: 1 | -1): Date {
  if (view === "day") return addDays(anchor, direction);
  if (view === "week") return addWeeks(anchor, direction);
  return addMonths(anchor, direction);
}

function eventsOnDay(bookings: AdminBookingRow[], day: Date): AdminBookingRow[] {
  return bookings
    .filter((booking) => booking.session && isSameDay(new Date(booking.session.startAt), day))
    .sort((a, b) => new Date(a.session!.startAt).getTime() - new Date(b.session!.startAt).getTime());
}

const STATUS_DOT: Record<AdminBookingRow["status"], string> = {
  booked: "bg-clay",
  completed: "bg-emerald-500",
  cancelled: "bg-charcoal/30",
  no_show: "bg-red-500",
};

export default async function AdminCalendarPage({
  searchParams,
}: {
  searchParams: Promise<{ view?: ViewMode; date?: string }>;
}) {
  await requireAdmin();
  const params = await searchParams;
  const view: ViewMode = params.view === "week" || params.view === "day" ? params.view : "month";
  const anchor = parseAnchorDate(params.date);
  const { from, to } = rangeFor(view, anchor);

  const bookings = await getAdminBookings({
    from: from.toISOString(),
    to: to.toISOString(),
    status: undefined,
  });
  // Only real scheduled sessions produce calendar events — no hardcoded data.
  const scheduled = bookings.filter((booking) => booking.status !== "cancelled");

  const prevHref = `/admin/calendar?view=${view}&date=${format(shiftAnchor(view, anchor, -1), "yyyy-MM-dd")}`;
  const nextHref = `/admin/calendar?view=${view}&date=${format(shiftAnchor(view, anchor, 1), "yyyy-MM-dd")}`;
  const todayHref = `/admin/calendar?view=${view}&date=${format(new Date(), "yyyy-MM-dd")}`;

  return (
    <div>
      <div className="flex flex-wrap items-center justify-between gap-4">
        <h1 className="font-display text-2xl text-charcoal">
          {view === "day" ? format(anchor, "MMMM d, yyyy") : view === "week" ? `Week of ${format(from, "MMM d")}` : format(anchor, "MMMM yyyy")}
        </h1>
        <div className="flex items-center gap-2">
          <ViewLink view="month" current={view} date={anchor} />
          <ViewLink view="week" current={view} date={anchor} />
          <ViewLink view="day" current={view} date={anchor} />
          <Link href={prevHref} className="rounded-full border border-charcoal/15 px-3 py-1.5 text-sm hover:bg-charcoal/5">
            ←
          </Link>
          <Link href={todayHref} className="rounded-full border border-charcoal/15 px-3 py-1.5 text-sm hover:bg-charcoal/5">
            Today
          </Link>
          <Link href={nextHref} className="rounded-full border border-charcoal/15 px-3 py-1.5 text-sm hover:bg-charcoal/5">
            →
          </Link>
        </div>
      </div>

      {scheduled.length === 0 && (
        <p className="mt-4 text-sm text-charcoal/55">
          No sessions in this range yet. Once class sessions are scheduled and booked, they&rsquo;ll appear here
          automatically — nothing on this calendar is hardcoded.
        </p>
      )}

      <div className="mt-6">
        {view === "month" && <MonthGrid anchor={anchor} from={from} to={to} bookings={scheduled} />}
        {view === "week" && <WeekAgenda from={from} bookings={scheduled} />}
        {view === "day" && <DayAgenda day={anchor} bookings={scheduled} />}
      </div>
    </div>
  );
}

function ViewLink({ view, current, date }: { view: ViewMode; current: ViewMode; date: Date }) {
  return (
    <Link
      href={`/admin/calendar?view=${view}&date=${format(date, "yyyy-MM-dd")}`}
      className={cn(
        "rounded-full px-3 py-1.5 text-sm capitalize transition-colors",
        current === view ? "bg-charcoal text-ivory" : "border border-charcoal/15 hover:bg-charcoal/5"
      )}
    >
      {view}
    </Link>
  );
}

function MonthGrid({ anchor, from, to, bookings }: { anchor: Date; from: Date; to: Date; bookings: AdminBookingRow[] }) {
  const days = eachDayOfInterval({ start: from, end: to });

  return (
    <div className="overflow-hidden rounded-xl border border-charcoal/10 bg-ivory">
      <div className="grid grid-cols-7 border-b border-charcoal/10 text-center text-xs uppercase tracking-[0.08em] text-charcoal/45">
        {["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].map((day) => (
          <div key={day} className="py-2">
            {day}
          </div>
        ))}
      </div>
      <div className="grid grid-cols-7">
        {days.map((day) => {
          const dayEvents = eventsOnDay(bookings, day);
          const visible = dayEvents.slice(0, 3);
          const overflow = dayEvents.length - visible.length;
          return (
            <Link
              key={day.toISOString()}
              href={`/admin/calendar?view=day&date=${format(day, "yyyy-MM-dd")}`}
              className={cn(
                "min-h-[110px] border-b border-r border-charcoal/5 p-2 text-left transition-colors hover:bg-cream/40",
                !isSameMonth(day, anchor) && "bg-charcoal/[0.02] text-charcoal/30"
              )}
            >
              <p className="text-xs font-medium">{format(day, "d")}</p>
              <div className="mt-1 space-y-1">
                {visible.map((booking) => (
                  <div key={booking.id} className="flex items-center gap-1 truncate rounded bg-cream/60 px-1.5 py-0.5 text-[11px] text-charcoal/75">
                    <span className={cn("h-1.5 w-1.5 shrink-0 rounded-full", STATUS_DOT[booking.status])} />
                    <span className="truncate">
                      {format(new Date(booking.session!.startAt), "h:mma")} {booking.customer.name}
                    </span>
                  </div>
                ))}
                {overflow > 0 && <p className="text-[11px] text-charcoal/45">+{overflow} more</p>}
              </div>
            </Link>
          );
        })}
      </div>
    </div>
  );
}

function WeekAgenda({ from, bookings }: { from: Date; bookings: AdminBookingRow[] }) {
  const days = eachDayOfInterval({ start: from, end: addDays(from, 6) });

  return (
    <div className="grid gap-4 sm:grid-cols-7">
      {days.map((day) => {
        const dayEvents = eventsOnDay(bookings, day);
        return (
          <div key={day.toISOString()} className="rounded-xl border border-charcoal/10 bg-ivory p-3">
            <p className="text-xs font-medium uppercase tracking-[0.08em] text-charcoal/50">{format(day, "EEE d")}</p>
            <div className="mt-2 space-y-1.5">
              {dayEvents.length === 0 && <p className="text-xs text-charcoal/35">—</p>}
              {dayEvents.map((booking) => (
                <Link
                  key={booking.id}
                  href={`/admin/bookings/${booking.id}`}
                  className="block rounded-lg bg-cream/50 px-2 py-1.5 text-xs text-charcoal/75 hover:bg-cream"
                >
                  <span className="font-medium">{format(new Date(booking.session!.startAt), "h:mm a")}</span>
                  <br />
                  {booking.customer.name} · {booking.session?.className}
                </Link>
              ))}
            </div>
          </div>
        );
      })}
    </div>
  );
}

function DayAgenda({ day, bookings }: { day: Date; bookings: AdminBookingRow[] }) {
  const dayEvents = eventsOnDay(bookings, day);

  if (dayEvents.length === 0) {
    return <p className="text-sm text-charcoal/55">No sessions booked for this day.</p>;
  }

  return (
    <div className="divide-y divide-charcoal/10 rounded-xl border border-charcoal/10 bg-ivory">
      {dayEvents.map((booking) => (
        <Link
          key={booking.id}
          href={`/admin/bookings/${booking.id}`}
          className="flex items-center justify-between gap-4 px-5 py-4 hover:bg-cream/40"
        >
          <div className="flex items-center gap-3">
            <span className={cn("h-2 w-2 shrink-0 rounded-full", STATUS_DOT[booking.status])} />
            <div>
              <p className="font-medium text-charcoal">
                {format(new Date(booking.session!.startAt), "h:mm a")} — {booking.customer.name}
              </p>
              <p className="text-sm text-charcoal/55">
                {booking.session?.className} · {booking.session?.location}
                {booking.session?.instructor ? ` · ${booking.session.instructor}` : ""}
              </p>
            </div>
          </div>
          <span className="text-xs uppercase tracking-[0.08em] text-charcoal/45">{booking.status}</span>
        </Link>
      ))}
    </div>
  );
}
