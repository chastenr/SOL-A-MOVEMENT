"use client";

import Image from "next/image";
import { useEffect, useMemo, useRef, useState } from "react";
import { differenceInMinutes } from "date-fns";
import { CalendarDays, ChevronLeft, ChevronRight, Clock3, MapPin, UserRound, Users, X } from "lucide-react";
import { isPastBookingCutoff } from "@/lib/booking-cutoff";
import { getArrivalTime } from "@/lib/studio-hours";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/Button";
import { BookSessionButton } from "@/components/account/BookSessionButton";

export type ScheduleExplorerSession = {
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
  status?: "scheduled" | "cancelled";
};

type MemberPackage = { id: string; name: string; entitlementType?: "credits" | "membership" };

const MANILA_TIME_ZONE = "Asia/Manila";
const dateKeyFormatter = new Intl.DateTimeFormat("en-CA", {
  timeZone: MANILA_TIME_ZONE,
  year: "numeric",
  month: "2-digit",
  day: "2-digit",
});
const weekdayFormatter = new Intl.DateTimeFormat("en-PH", { timeZone: MANILA_TIME_ZONE, weekday: "short" });
const dayFormatter = new Intl.DateTimeFormat("en-PH", { timeZone: MANILA_TIME_ZONE, day: "numeric" });
const monthFormatter = new Intl.DateTimeFormat("en-PH", { timeZone: MANILA_TIME_ZONE, month: "short" });
const calendarMonthFormatter = new Intl.DateTimeFormat("en-PH", {
  timeZone: "UTC",
  month: "long",
  year: "numeric",
});

// Five sessions still fit in a calendar row while remaining readable. Any
// additional sessions stay available in the full day list directly below.
const MAX_CALENDAR_SESSIONS = 5;
const fullDateFormatter = new Intl.DateTimeFormat("en-PH", {
  timeZone: MANILA_TIME_ZONE,
  weekday: "long",
  month: "long",
  day: "numeric",
  year: "numeric",
});
const timeFormatter = new Intl.DateTimeFormat("en-PH", {
  timeZone: MANILA_TIME_ZONE,
  hour: "numeric",
  minute: "2-digit",
});

function sessionState(session: ScheduleExplorerSession, alreadyBooked = false) {
  const isCancelled = session.status === "cancelled";
  const isFull = session.bookedCount >= session.capacity;
  const cutoffPassed = isPastBookingCutoff(new Date(session.startAt));
  const spotsLeft = Math.max(session.capacity - session.bookedCount, 0);
  const canBook = !alreadyBooked && !isCancelled && session.bookingEnabled && !isFull && !cutoffPassed;
  const label = alreadyBooked
    ? "Booked"
    : isCancelled
      ? "Cancelled"
      : !session.bookingEnabled
    ? "Unavailable"
    : isFull
      ? "Full"
      : cutoffPassed
        ? "Closed"
        : `${spotsLeft} spot${spotsLeft === 1 ? "" : "s"}`;

  return { canBook, spotsLeft, label };
}

const CALENDAR_WEEKDAYS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

function calendarDays(monthKey: string) {
  const [year, month] = monthKey.split("-").map(Number);
  const firstWeekday = new Date(Date.UTC(year, month - 1, 1)).getUTCDay();
  const daysInMonth = new Date(Date.UTC(year, month, 0)).getUTCDate();
  const previousMonthDays = new Date(Date.UTC(year, month - 1, 0)).getUTCDate();

  return Array.from({ length: 42 }, (_, index) => {
    const calendarDay = index - firstWeekday + 1;
    let cellYear = year;
    let cellMonth = month;
    let day = calendarDay;

    if (calendarDay < 1) {
      cellMonth -= 1;
      if (cellMonth === 0) {
        cellMonth = 12;
        cellYear -= 1;
      }
      day = previousMonthDays + calendarDay;
    } else if (calendarDay > daysInMonth) {
      cellMonth += 1;
      if (cellMonth === 13) {
        cellMonth = 1;
        cellYear += 1;
      }
      day = calendarDay - daysInMonth;
    }

    return {
      key: `${cellYear}-${String(cellMonth).padStart(2, "0")}-${String(day).padStart(2, "0")}`,
      day,
      inMonth: cellMonth === month,
    };
  });
}

export function ScheduleExplorer({
  sessions,
  memberPackage,
  memberPackagesBySessionId,
  bookedSessionIds = [],
  uncoveredSessionHref,
}: {
  sessions: ScheduleExplorerSession[];
  memberPackage?: MemberPackage;
  memberPackagesBySessionId?: Record<string, MemberPackage>;
  uncoveredSessionHref?: string;
  bookedSessionIds?: string[];
}) {
  const sessionsByDate = useMemo(() => {
    const groups = new Map<string, ScheduleExplorerSession[]>();
    for (const session of sessions) {
      const key = dateKeyFormatter.format(new Date(session.startAt));
      groups.set(key, [...(groups.get(key) ?? []), session]);
    }
    return [...groups.entries()].sort(([a], [b]) => a.localeCompare(b));
  }, [sessions]);

  const sessionsByDateMap = useMemo(() => new Map(sessionsByDate), [sessionsByDate]);
  const availableMonths = useMemo(
    () => [...new Set(sessionsByDate.map(([key]) => key.slice(0, 7)))],
    [sessionsByDate]
  );

  const [requestedDate, setRequestedDate] = useState(sessionsByDate[0]?.[0] ?? "");
  const [requestedMonth, setRequestedMonth] = useState(availableMonths[0] ?? "");
  const [selectedSession, setSelectedSession] = useState<ScheduleExplorerSession | null>(null);
  const closeButtonRef = useRef<HTMLButtonElement>(null);
  const selectedDate = sessionsByDate.some(([key]) => key === requestedDate)
    ? requestedDate
    : (sessionsByDate[0]?.[0] ?? "");
  const selectedDay = sessionsByDate.find(([key]) => key === selectedDate)?.[1] ?? [];
  const visibleMonth = availableMonths.includes(requestedMonth) ? requestedMonth : (availableMonths[0] ?? "");
  const visibleMonthIndex = availableMonths.indexOf(visibleMonth);
  const visibleCalendarDays = useMemo(() => calendarDays(visibleMonth), [visibleMonth]);

  function showMonth(index: number) {
    const month = availableMonths[index];
    if (!month) return;
    setRequestedMonth(month);
    const firstAvailableDate = sessionsByDate.find(([key]) => key.startsWith(month))?.[0];
    if (firstAvailableDate) setRequestedDate(firstAvailableDate);
    setSelectedSession(null);
  }

  useEffect(() => {
    if (!selectedSession) return;
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    closeButtonRef.current?.focus();

    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") setSelectedSession(null);
    }

    window.addEventListener("keydown", handleKeyDown);
    return () => {
      window.removeEventListener("keydown", handleKeyDown);
      document.body.style.overflow = previousOverflow;
    };
  }, [selectedSession]);

  if (sessionsByDate.length === 0) return null;

  return (
    <div data-no-text-reveal>
      <div className="rounded-[1.75rem] border border-charcoal/10 bg-ivory p-4 shadow-[0_20px_55px_-48px_rgba(34,31,28,0.55)] sm:p-6 lg:hidden">
        <div className="flex items-center justify-between gap-4 px-1">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.16em] text-clay">Step 1</p>
            <h2 className="font-display mt-1 text-2xl text-charcoal">Choose a date</h2>
          </div>
          <p className="hidden text-sm text-charcoal/70 sm:block">Times shown in Philippine Time</p>
        </div>

        <div className="no-scrollbar mt-5 flex gap-2 overflow-x-auto pb-2" role="tablist" aria-label="Available class dates">
          {sessionsByDate.map(([key, daySessions]) => {
            const date = new Date(daySessions[0].startAt);
            const active = key === selectedDate;
            return (
              <button
                key={key}
                type="button"
                role="tab"
                aria-selected={active}
                aria-controls="daily-schedule"
                onClick={() => {
                  setRequestedDate(key);
                  setSelectedSession(null);
                }}
                className={cn(
                  "min-w-[5.25rem] shrink-0 rounded-2xl border px-4 py-3 text-center transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-clay",
                  active
                    ? "border-charcoal bg-charcoal text-ivory"
                    : "border-charcoal/10 bg-cream/35 text-charcoal hover:border-clay/45 hover:bg-cream/70"
                )}
              >
                <span className={cn("block text-xs font-medium uppercase tracking-[0.12em]", active ? "text-ivory/80" : "text-charcoal/70")}>
                  {weekdayFormatter.format(date)}
                </span>
                <span className="font-display mt-1 block text-2xl leading-none">{dayFormatter.format(date)}</span>
                <span className={cn("mt-1 block text-xs font-medium uppercase tracking-[0.1em]", active ? "text-ivory/80" : "text-charcoal/70")}>
                  {monthFormatter.format(date)} · {daySessions.length}
                </span>
              </button>
            );
          })}
        </div>
      </div>

      <section
        className="hidden overflow-hidden rounded-[1.75rem] border border-charcoal/10 bg-ivory shadow-[0_20px_55px_-48px_rgba(34,31,28,0.55)] lg:block"
        aria-labelledby="calendar-heading"
      >
        <div className="flex items-center justify-between border-b border-charcoal/10 px-6 py-5">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.16em] text-clay">Live class calendar</p>
            <h2 id="calendar-heading" className="font-display mt-1 text-3xl text-charcoal">
              {calendarMonthFormatter.format(
                new Date(Date.UTC(Number(visibleMonth.slice(0, 4)), Number(visibleMonth.slice(5, 7)) - 1, 1))
              )}
            </h2>
          </div>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => showMonth(visibleMonthIndex - 1)}
              disabled={visibleMonthIndex <= 0}
              aria-label="Show previous available month"
              className="flex h-11 w-11 items-center justify-center rounded-full border border-charcoal/15 text-charcoal transition-colors hover:border-charcoal hover:bg-cream disabled:cursor-not-allowed disabled:opacity-30"
            >
              <ChevronLeft size={18} aria-hidden />
            </button>
            <button
              type="button"
              onClick={() => showMonth(visibleMonthIndex + 1)}
              disabled={visibleMonthIndex < 0 || visibleMonthIndex >= availableMonths.length - 1}
              aria-label="Show next available month"
              className="flex h-11 w-11 items-center justify-center rounded-full border border-charcoal/15 text-charcoal transition-colors hover:border-charcoal hover:bg-cream disabled:cursor-not-allowed disabled:opacity-30"
            >
              <ChevronRight size={18} aria-hidden />
            </button>
          </div>
        </div>

        <div className="grid grid-cols-7 border-b border-charcoal/10 bg-cream/40" aria-hidden>
          {CALENDAR_WEEKDAYS.map((weekday) => (
            <div key={weekday} className="border-r border-charcoal/10 px-3 py-2.5 text-center text-xs font-semibold uppercase tracking-[0.12em] text-charcoal/60 last:border-r-0">
              {weekday}
            </div>
          ))}
        </div>

        <div className="grid grid-cols-7" role="group" aria-label={`${calendarMonthFormatter.format(new Date(Date.UTC(Number(visibleMonth.slice(0, 4)), Number(visibleMonth.slice(5, 7)) - 1, 1)))} class schedule`}>
          {visibleCalendarDays.map((cell, index) => {
            const daySessions = sessionsByDateMap.get(cell.key) ?? [];
            const isSelected = cell.key === selectedDate;
            const hasSessions = daySessions.length > 0;

            return (
              <button
                key={cell.key}
                type="button"
                disabled={!hasSessions}
                aria-pressed={isSelected}
                aria-label={`${cell.key}, ${daySessions.length} class${daySessions.length === 1 ? "" : "es"}`}
                onClick={() => {
                  setRequestedDate(cell.key);
                  setSelectedSession(null);
                }}
                className={cn(
                  "min-h-44 border-b border-r border-charcoal/10 p-2.5 text-left align-top transition-colors focus-visible:relative focus-visible:z-10 focus-visible:outline-2 focus-visible:outline-inset focus-visible:outline-clay",
                  index % 7 === 6 && "border-r-0",
                  index >= 35 && "border-b-0",
                  !cell.inMonth && "bg-cream/20 text-charcoal/30",
                  cell.inMonth && !hasSessions && "cursor-default bg-ivory text-charcoal/45",
                  hasSessions && "hover:bg-cream/40",
                  isSelected && "bg-sand/35 ring-2 ring-inset ring-clay/55"
                )}
              >
                <span className={cn("flex h-7 w-7 items-center justify-center rounded-full text-sm font-semibold", isSelected && "bg-charcoal text-ivory")}>
                  {cell.day}
                </span>
                {daySessions.length > 0 && (
                  <span className="mt-2 block space-y-1.5">
                    <span className="block px-0.5 text-[10px] font-semibold uppercase tracking-[0.08em] text-charcoal/55">
                      {daySessions.length} {daySessions.length === 1 ? "class" : "classes"}
                    </span>
                    {daySessions.slice(0, MAX_CALENDAR_SESSIONS).map((session) => {
                      const state = sessionState(session, bookedSessionIds.includes(session.id));
                      return (
                        <span
                          key={session.id}
                          title={`${timeFormatter.format(new Date(session.startAt))} · ${session.className} · ${state.label}`}
                          className="block rounded-lg border border-clay/20 bg-clay/8 px-2 py-1.5"
                        >
                          <span className="block text-[10px] font-semibold uppercase tracking-[0.04em] text-clay">
                            {timeFormatter.format(new Date(session.startAt))}
                          </span>
                          <span className="mt-0.5 block line-clamp-2 text-xs font-semibold leading-[1.25] text-charcoal">
                            {session.className}
                          </span>
                          <span className={cn("mt-1 block text-[10px] font-medium uppercase tracking-[0.04em]", state.canBook ? "text-clay" : "text-charcoal/50")}>
                            {state.label}
                          </span>
                        </span>
                      );
                    })}
                    {daySessions.length > MAX_CALENDAR_SESSIONS && (
                      <span className="block px-1 text-[11px] font-medium text-charcoal/55">
                        +{daySessions.length - MAX_CALENDAR_SESSIONS} more in the day list
                      </span>
                    )}
                  </span>
                )}
              </button>
            );
          })}
        </div>
      </section>

      <section id="daily-schedule" role="tabpanel" className="mt-7" aria-labelledby="daily-schedule-heading">
        <div className="mb-4 flex flex-col gap-1 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.16em] text-clay">Step 2</p>
            <h2 id="daily-schedule-heading" className="font-display mt-1 text-3xl text-charcoal">
              {selectedDay[0] ? fullDateFormatter.format(new Date(selectedDay[0].startAt)) : "Daily schedule"}
            </h2>
          </div>
          <p className="text-sm text-charcoal/70">Select a time to see class and coach details</p>
        </div>

        <div className="overflow-hidden rounded-[1.5rem] border border-charcoal/10 bg-ivory">
          {selectedDay.map((session, index) => {
            const state = sessionState(session, bookedSessionIds.includes(session.id));
            return (
              <button
                key={session.id}
                type="button"
                onClick={() => setSelectedSession(session)}
                className={cn(
                  "group grid w-full grid-cols-[5.75rem_1fr_auto] items-center gap-3 px-4 py-4 text-left transition-colors hover:bg-cream/45 focus-visible:relative focus-visible:z-10 focus-visible:outline-2 focus-visible:outline-inset focus-visible:outline-clay sm:grid-cols-[8rem_1fr_9rem_auto] sm:px-6 sm:py-5",
                  index > 0 && "border-t border-charcoal/10"
                )}
                aria-label={`${timeFormatter.format(new Date(session.startAt))}, ${session.className}, ${state.label}`}
              >
                <p className="font-display text-xl text-charcoal sm:text-2xl">
                  {timeFormatter.format(new Date(session.startAt))}
                </p>
                <div className="min-w-0">
                  <p className="line-clamp-2 text-base leading-snug text-charcoal sm:text-lg">{session.className}</p>
                  <p className="mt-1 truncate text-sm text-charcoal/70">
                    {session.instructor ? `with ${session.instructor}` : "Coach to be announced"}
                  </p>
                </div>
                <div className="hidden sm:block">
                  <span className={cn(
                    "rounded-full px-3 py-1.5 text-xs font-semibold uppercase tracking-[0.08em]",
                    state.canBook ? "bg-clay/10 text-clay" : "bg-charcoal/8 text-charcoal/45"
                  )}>
                    {state.label}
                  </span>
                </div>
                <ChevronRight className="h-4 w-4 text-charcoal/35 transition-transform group-hover:translate-x-0.5 group-hover:text-clay" aria-hidden />
              </button>
            );
          })}
        </div>
      </section>

      {selectedSession && (
        <SessionDetailDialog
          session={selectedSession}
          memberPackage={memberPackagesBySessionId?.[selectedSession.id] ?? memberPackage}
          uncoveredSessionHref={uncoveredSessionHref}
          alreadyBooked={bookedSessionIds.includes(selectedSession.id)}
          closeButtonRef={closeButtonRef}
          onClose={() => setSelectedSession(null)}
        />
      )}
    </div>
  );
}

function SessionDetailDialog({
  session,
  memberPackage,
  uncoveredSessionHref,
  alreadyBooked,
  closeButtonRef,
  onClose,
}: {
  session: ScheduleExplorerSession;
  memberPackage?: MemberPackage;
  uncoveredSessionHref?: string;
  alreadyBooked: boolean;
  closeButtonRef: React.RefObject<HTMLButtonElement | null>;
  onClose: () => void;
}) {
  const startAt = new Date(session.startAt);
  const endAt = new Date(session.endAt);
  const state = sessionState(session, alreadyBooked);
  const arrivalTime = timeFormatter.format(getArrivalTime(startAt));
  const bookingHref = `/book?${new URLSearchParams({ session: session.id, service: session.serviceSlug }).toString()}`;
  const coachInitial = session.instructor?.trim().charAt(0).toUpperCase() || "V";

  return (
    <div className="fixed inset-0 z-[90] flex items-end justify-center bg-charcoal/55 sm:items-center sm:px-5" role="presentation" onMouseDown={(event) => event.target === event.currentTarget && onClose()}>
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="session-detail-title"
        className="max-h-[92vh] w-full overflow-y-auto rounded-t-[2rem] bg-ivory shadow-2xl sm:max-w-2xl sm:rounded-[2rem]"
      >
        <div className="sticky top-0 z-10 flex items-center justify-between border-b border-charcoal/10 bg-ivory/95 px-5 py-4 backdrop-blur sm:px-7">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.16em] text-clay">Class details</p>
            <p className="mt-0.5 text-sm text-charcoal/70">Review before booking</p>
          </div>
          <button
            ref={closeButtonRef}
            type="button"
            onClick={onClose}
            aria-label="Close class details"
            className="flex h-10 w-10 items-center justify-center rounded-full border border-charcoal/10 text-charcoal transition-colors hover:bg-cream focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-clay"
          >
            <X size={18} aria-hidden />
          </button>
        </div>

        <div className="p-5 sm:p-7">
          <div className="flex flex-wrap items-start justify-between gap-4">
            <div>
              <p className="text-xs uppercase tracking-[0.15em] text-clay">{session.level}</p>
              <h2 id="session-detail-title" className="font-display mt-2 text-3xl leading-tight text-charcoal sm:text-4xl">
                {session.className}
              </h2>
            </div>
            <span className={cn("rounded-full px-3.5 py-2 text-xs font-semibold uppercase tracking-[0.1em]", state.canBook ? "bg-clay/10 text-clay" : "bg-charcoal/8 text-charcoal/70")}>
              {state.label}
            </span>
          </div>

          {session.classDescription && <p className="mt-4 text-base leading-[1.7] text-charcoal/75">{session.classDescription}</p>}

          <dl className="mt-6 grid gap-3 rounded-2xl bg-cream/55 p-4 text-base leading-relaxed sm:grid-cols-2 sm:p-5">
            <div className="flex gap-3"><CalendarDays className="mt-0.5 h-4 w-4 shrink-0 text-clay" aria-hidden /><div><dt className="text-charcoal/40">Date</dt><dd className="mt-0.5 text-charcoal">{fullDateFormatter.format(startAt)}</dd></div></div>
            <div className="flex gap-3"><Clock3 className="mt-0.5 h-4 w-4 shrink-0 text-clay" aria-hidden /><div><dt className="text-charcoal/40">Time</dt><dd className="mt-0.5 text-charcoal">{timeFormatter.format(startAt)}–{timeFormatter.format(endAt)} · {differenceInMinutes(endAt, startAt)} min</dd></div></div>
            <div className="flex gap-3"><MapPin className="mt-0.5 h-4 w-4 shrink-0 text-clay" aria-hidden /><div><dt className="text-charcoal/40">Studio</dt><dd className="mt-0.5 text-charcoal">{session.location}</dd></div></div>
            <div className="flex gap-3"><Users className="mt-0.5 h-4 w-4 shrink-0 text-clay" aria-hidden /><div><dt className="text-charcoal/40">Arrival</dt><dd className="mt-0.5 text-charcoal">Please arrive by {arrivalTime}</dd></div></div>
          </dl>

          <section className="mt-7 border-t border-charcoal/10 pt-6" aria-labelledby="coach-heading">
            <p className="text-xs font-semibold uppercase tracking-[0.16em] text-clay">Your coach</p>
            <div className="mt-4 flex items-start gap-4">
              {session.instructorPhotoUrl ? (
                <Image src={session.instructorPhotoUrl} alt={`${session.instructor ?? "Veora coach"} profile`} width={112} height={112} quality={92} sizes="80px" className="h-20 w-20 shrink-0 rounded-2xl object-cover" />
              ) : (
                <div className="flex h-20 w-20 shrink-0 items-center justify-center rounded-2xl bg-sand/55" aria-hidden>
                  {session.instructor ? <span className="font-display text-3xl text-charcoal/55">{coachInitial}</span> : <UserRound className="h-7 w-7 text-charcoal/35" />}
                </div>
              )}
              <div>
                <h3 id="coach-heading" className="font-display text-2xl text-charcoal">{session.instructor ?? "To be announced"}</h3>
                <p className="mt-2 text-base leading-[1.7] text-charcoal/75">
                  {session.instructorBio ?? (session.instructor ? "More information about this coach will be added soon." : "The assigned coach will be shown here once the studio confirms the schedule.")}
                </p>
              </div>
            </div>
          </section>

          <div className="mt-7 border-t border-charcoal/10 pt-6">
            {state.canBook ? (
              memberPackage ? (
                <BookSessionButton
                  classSessionId={session.id}
                  customerPackageId={memberPackage.entitlementType === "membership" ? undefined : memberPackage.id}
                  customerMembershipId={memberPackage.entitlementType === "membership" ? memberPackage.id : undefined}
                  sessionName={session.className}
                  coachName={session.instructor ?? "TBA"}
                  scheduleLabel={`${fullDateFormatter.format(startAt)} at ${timeFormatter.format(startAt)} · ${session.location}`}
                  formattedDate={fullDateFormatter.format(startAt)}
                  timeRange={`${timeFormatter.format(startAt)} – ${timeFormatter.format(endAt)}`}
                  arrivalTime={arrivalTime}
                  packageName={memberPackage.name}
                  onDone={onClose}
                />
              ) : (
                <Button href={uncoveredSessionHref ?? bookingHref} size="lg" className="w-full">
                  {uncoveredSessionHref ? "View Package Options" : "Book this class"}
                </Button>
              )
            ) : (
              <p className="rounded-xl bg-charcoal/5 px-4 py-3 text-center text-base text-charcoal/75">This session is currently {state.label.toLowerCase()}.</p>
            )}
            <p className="mt-3 text-center text-sm leading-relaxed text-charcoal/70">Bookings close at 10:00 PM the evening before class. The 12-hour cancellation policy applies.</p>
          </div>
        </div>
      </div>
    </div>
  );
}
