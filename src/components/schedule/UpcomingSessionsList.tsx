import Image from "next/image";
import { differenceInMinutes } from "date-fns";
import { CalendarDays, Clock3, MapPin, Users } from "lucide-react";
import type { UpcomingSessionRow } from "@/lib/catalog/sessions";
import { isPastBookingCutoff } from "@/lib/booking-cutoff";
import { getArrivalTime } from "@/lib/studio-hours";
import { Button } from "@/components/ui/Button";

const serviceLabels: Record<string, string> = {
  "mat-pilates": "Pilates",
  yoga: "Yoga",
  barre: "Barre",
  "strength-hiit": "Strength & HIIT",
  "recovery-restore": "Restore",
  ballet: "Ballet",
};

const dateFormatter = new Intl.DateTimeFormat("en-US", {
  timeZone: "Asia/Manila",
  weekday: "short",
  month: "short",
  day: "numeric",
});

const timeFormatter = new Intl.DateTimeFormat("en-US", {
  timeZone: "Asia/Manila",
  hour: "numeric",
  minute: "2-digit",
});

/** Server component — live schedule data without unnecessary client-side filters. */
export function UpcomingSessionsList({ sessions }: { sessions: UpcomingSessionRow[] }) {
  return (
    <div className="grid gap-4 md:grid-cols-2">
      {sessions.map((session) => {
        const startAt = new Date(session.startAt);
        const endAt = new Date(session.endAt);
        const isFull = session.bookedCount >= session.capacity;
        const isUnavailable = !session.bookingEnabled;
        const cutoffPassed = isPastBookingCutoff(startAt);
        const spotsLeft = Math.max(session.capacity - session.bookedCount, 0);
        const canBook = !isFull && !isUnavailable && !cutoffPassed;
        const isFillingFast = canBook && spotsLeft <= 3;
        const duration = differenceInMinutes(endAt, startAt);
        const arrivalTime = timeFormatter.format(getArrivalTime(startAt));
        const bookingHref = `/book?${new URLSearchParams({
          session: session.id,
          service: session.serviceSlug,
        }).toString()}`;
        const status = isUnavailable
          ? "Unavailable"
          : isFull
            ? "Full"
            : cutoffPassed
              ? "Closed"
              : `${spotsLeft} spot${spotsLeft === 1 ? "" : "s"} left`;

        return (
          <article
            key={session.id}
            className="flex min-h-72 flex-col rounded-[1.5rem] border border-charcoal/10 bg-ivory p-5 shadow-sm shadow-charcoal/[0.03] sm:p-6"
          >
            <div>
              <div className="flex items-start justify-between gap-4">
                <p className="text-[10px] font-medium uppercase tracking-[0.22em] text-clay">
                  {serviceLabels[session.serviceSlug] ?? "Class"}
                </p>
                <span className="shrink-0 rounded-full border border-charcoal/10 bg-cream/70 px-3 py-1 text-[10px] uppercase tracking-[0.1em] text-charcoal/55">
                  {status}
                </span>
              </div>

              <div className="mt-3 flex flex-wrap items-center gap-2">
                <h2 className="font-display text-3xl leading-tight text-charcoal">{session.className}</h2>
                {session.level && (
                  <span className="shrink-0 rounded-full bg-clay/10 px-2.5 py-0.5 text-[0.6rem] uppercase tracking-[0.1em] text-clay">
                    {session.level}
                  </span>
                )}
              </div>
              <p className="mt-1.5 flex items-center gap-2 text-sm text-charcoal/50">
                {session.instructorPhotoUrl && (
                  <Image
                    src={session.instructorPhotoUrl}
                    alt=""
                    width={40}
                    height={40}
                    quality={92}
                    sizes="20px"
                    className="h-5 w-5 rounded-full object-cover"
                  />
                )}
                Coach {session.instructor ?? "TBA"}
              </p>

              <div className="mt-6 grid gap-2.5 text-sm text-charcoal/60 sm:grid-cols-2">
                <p className="flex items-center gap-2">
                  <CalendarDays className="h-4 w-4 shrink-0 text-clay" aria-hidden />
                  {dateFormatter.format(startAt)}
                </p>
                <p className="flex items-center gap-2">
                  <Clock3 className="h-4 w-4 shrink-0 text-clay" aria-hidden />
                  {timeFormatter.format(startAt)} · {duration} min
                </p>
                <p className="flex items-center gap-2 sm:col-span-2">
                  <MapPin className="h-4 w-4 shrink-0 text-clay" aria-hidden />
                  {session.location}
                </p>
                <p className="flex items-center gap-2 sm:col-span-2">
                  <Users className="h-4 w-4 shrink-0 text-clay" aria-hidden />
                  {isFillingFast ? "Filling fast — book soon" : `Please arrive by ${arrivalTime}`}
                </p>
              </div>
            </div>

            <div className="mt-auto pt-6">
              {canBook ? (
                <Button href={bookingHref}>Book This Class</Button>
              ) : (
                <span className="inline-flex rounded-full bg-charcoal/8 px-5 py-2.5 text-[0.72rem] font-medium uppercase tracking-[0.18em] text-charcoal/40">
                  Booking {status}
                </span>
              )}
            </div>
          </article>
        );
      })}
    </div>
  );
}
