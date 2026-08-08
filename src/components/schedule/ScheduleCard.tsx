import { format, parseISO } from "date-fns";
import { Button } from "@/components/ui/Button";

export type ScheduleCardData = {
  id: string;
  date: string;
  time: string;
  duration: string;
  instructor: string;
  spots: number;
  service: { slug: string; name: string; category: string };
};

export function ScheduleCard({ session }: { session: ScheduleCardData }) {
  const date = parseISO(session.date);
  const bookingHref = `/book?service=${session.service.slug}&date=${session.date.slice(0, 10)}&time=${encodeURIComponent(session.time)}`;

  return (
    <div className="flex flex-col justify-between rounded-2xl border border-charcoal/10 bg-ivory p-6 transition-shadow duration-300 hover:shadow-lg hover:shadow-charcoal/5">
      <div>
        <p className="text-xs uppercase tracking-[0.18em] text-clay">{session.service.category}</p>
        <h3 className="font-display mt-2 text-2xl text-charcoal">{session.service.name}</h3>
        <p className="mt-1 text-sm text-charcoal/60">{session.instructor}</p>

        <div className="mt-5 space-y-1 text-sm text-charcoal/75">
          <p>{format(date, "EEEE, MMMM d")}</p>
          <p>
            {session.time} · {session.duration}
          </p>
          <p className="text-charcoal/50">
            {session.spots} {session.spots === 1 ? "spot" : "spots"} available
          </p>
        </div>
      </div>

      <div className="mt-6">
        <Button href={bookingHref} className="w-full">
          Book
        </Button>
      </div>
    </div>
  );
}
