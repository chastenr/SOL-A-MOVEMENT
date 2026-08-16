import { createPageMetadata } from "@/lib/seo-metadata";
import { Clock3 } from "lucide-react";
import { getUpcomingSessions } from "@/lib/catalog/sessions";
import { AnimatedSection } from "@/components/ui/AnimatedSection";
import { Button } from "@/components/ui/Button";
import { ScheduleExplorer } from "@/components/schedule/ScheduleExplorer";

export const metadata = createPageMetadata({
  title: "Pilates & Wellness Class Schedule in Bacoor",
  description:
    "Browse upcoming Pilates, yoga, barre, strength, recovery and ballet classes at Veora Wellness in Bacoor, Cavite, then reserve your spot online.",
  path: "/schedule",
});

export default async function SchedulePage() {
  const sessions = await getUpcomingSessions(100);

  return (
    <section
      className="mx-auto max-w-7xl px-6 pt-40 pb-16 sm:px-8 sm:pb-20 lg:px-12"
      data-no-text-reveal
    >
      <AnimatedSection className="rounded-[2rem] border border-charcoal/10 bg-cream/60 px-6 py-9 sm:px-9 sm:py-11">
        <p className="text-xs font-semibold uppercase tracking-[0.18em] text-clay">Schedule</p>
        <h1 className="font-display balance mt-3 text-[clamp(2.5rem,5vw,4.75rem)] leading-[1.02] tracking-[-0.02em] text-charcoal">
          Class Schedule
        </h1>
        <p className="mt-5 max-w-[62ch] text-base leading-[1.7] text-charcoal/75 sm:text-[1.0625rem]">
          Browse live availability without an account. You&rsquo;ll only be asked to sign in when you choose a class to reserve.
        </p>
      </AnimatedSection>

      <div className="mt-10 flex items-start gap-3 rounded-2xl border border-charcoal/10 bg-ivory px-4 py-3.5 text-base leading-relaxed text-charcoal/75 sm:items-center">
        <Clock3 className="mt-0.5 h-4 w-4 shrink-0 text-clay sm:mt-0" aria-hidden />
        <p>Availability is shown below. Classes with three or fewer spots left are marked as filling fast.</p>
      </div>

      {sessions.length > 0 ? (
        <div className="mt-6">
          <ScheduleExplorer sessions={sessions} />
        </div>
      ) : (
        <div className="mt-6 rounded-[2rem] border border-charcoal/10 bg-ivory px-6 py-12 text-center sm:px-10">
          <h2 className="font-display text-3xl text-charcoal">New class times are coming soon.</h2>
          <p className="mx-auto mt-3 max-w-xl text-base leading-[1.7] text-charcoal/75">
            We&rsquo;re preparing the next schedule. Explore the class options now and check back for available dates.
          </p>
          <Button href="/services" variant="secondary" className="mt-6">
            Explore All Classes
          </Button>
        </div>
      )}

      <div className="mt-10 flex flex-col items-start justify-between gap-4 border-t border-charcoal/10 pt-7 sm:flex-row sm:items-center">
        <p className="text-base text-charcoal/75">Not sure which class is right for you?</p>
        <Button href="/services" variant="secondary">
          Explore All Classes
        </Button>
      </div>
    </section>
  );
}
