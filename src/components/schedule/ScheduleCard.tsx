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
        <p className="text-xs uppercase tracking-[0.18em] text-clay">{entry.category}</p>
        <h3 className="font-display mt-2 text-2xl text-charcoal">{entry.name}</h3>
        <p className="mt-3 text-sm leading-relaxed text-charcoal/65">{entry.description}</p>

        <div className="mt-5 space-y-1 text-sm text-charcoal/60">
          <p>
            {entry.duration} · {entry.level}
          </p>
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
