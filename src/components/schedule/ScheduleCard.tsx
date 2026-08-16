import { Button } from "@/components/ui/Button";
import { TiltCard } from "@/components/ui/TiltCard";
import type { ClassDirectoryEntry } from "@/data/schedule";

export function ScheduleCard({ entry }: { entry: ClassDirectoryEntry }) {
  const bookingHref = `/book?service=${encodeURIComponent(entry.serviceSlug)}&class=${encodeURIComponent(entry.id)}`;

  return (
    <TiltCard
      maxTilt={4}
      className="flex flex-col justify-between overflow-hidden rounded-2xl border border-charcoal/10 bg-ivory p-6 transition-shadow duration-300 hover:shadow-lg hover:shadow-charcoal/5"
    >
      <div>
        <div className="flex items-start justify-between gap-3">
          <p className="text-xs uppercase tracking-[0.18em] text-clay">{entry.category}</p>
          <span className="shrink-0 rounded-full bg-cream/70 px-2.5 py-0.5 text-xs font-semibold uppercase tracking-[0.08em] text-charcoal/70">
            {entry.level}
          </span>
        </div>
        <h3 className="font-display mt-2 text-2xl text-charcoal">{entry.name}</h3>
        <p className="mt-3 text-base leading-[1.7] text-charcoal/75">{entry.description}</p>

        <div className="mt-5 space-y-1 text-base text-charcoal/75">
          <p>{entry.duration}</p>
        </div>
      </div>

      <div className="mt-6">
        <Button href={bookingHref} className="w-full">
          Book
        </Button>
      </div>
    </TiltCard>
  );
}
