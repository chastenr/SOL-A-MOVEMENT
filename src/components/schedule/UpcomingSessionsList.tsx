import { format, differenceInMinutes } from "date-fns";
import type { UpcomingSessionRow } from "@/lib/catalog/sessions";
import { getArrivalTime } from "@/lib/studio-hours";
import { Button } from "@/components/ui/Button";

/** Server component — no client state needed, this is a plain data list. */
export function UpcomingSessionsList({
  sessions,
  bookHref,
}: {
  sessions: UpcomingSessionRow[];
  bookHref: string;
}) {
  return (
    <div className="divide-y divide-charcoal/10 rounded-2xl border border-charcoal/10 bg-ivory">
      {sessions.map((session) => {
        const isFull = session.bookedCount >= session.capacity;
        const isUnavailable = !session.bookingEnabled;
        const spotsLeft = session.capacity - session.bookedCount;
        const duration = differenceInMinutes(new Date(session.endAt), new Date(session.startAt));
        const arrivalTime = format(getArrivalTime(new Date(session.startAt)), "h:mm a");

        return (
          <div key={session.id} className="flex flex-wrap items-center justify-between gap-4 px-5 py-4">
            <div>
              <p className="text-charcoal">{session.className}</p>
              <p className="text-sm text-charcoal/55">
                {format(new Date(session.startAt), "EEEE, MMMM d")} ·{" "}
                {format(new Date(session.startAt), "h:mm a")}–{format(new Date(session.endAt), "h:mm a")} ·{" "}
                {duration} minutes
              </p>
              <p className="flex items-center gap-1.5 text-xs text-charcoal/40">
                {session.instructorPhotoUrl && (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={session.instructorPhotoUrl} alt="" className="h-4 w-4 rounded-full object-cover" />
                )}
                Coach {session.instructor ?? "TBA"} · {session.location}
              </p>
              <p className="mt-1 text-xs text-charcoal/40">Please arrive by {arrivalTime}.</p>
            </div>
            <div className="flex items-center gap-3">
              <span className="text-xs uppercase tracking-[0.1em] text-charcoal/45">
                {isUnavailable ? "Unavailable" : isFull ? "Full" : `${spotsLeft} spot${spotsLeft === 1 ? "" : "s"} left`}
              </span>
              {isUnavailable || isFull ? (
                <span className="rounded-full bg-charcoal/10 px-5 py-2.5 text-[0.68rem] uppercase tracking-[0.2em] text-charcoal/40">
                  {isUnavailable ? "Unavailable" : "Full"}
                </span>
              ) : (
                <Button href={bookHref} size="md">
                  Book
                </Button>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
}
