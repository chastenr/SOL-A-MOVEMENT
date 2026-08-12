import type { Metadata } from "next";
import { Clock3 } from "lucide-react";
import { getUpcomingSessions } from "@/lib/catalog/sessions";
import { AnimatedSection } from "@/components/ui/AnimatedSection";
import { Button } from "@/components/ui/Button";
import { UpcomingSessionsList } from "@/components/schedule/UpcomingSessionsList";

export const metadata: Metadata = {
  title: "Schedule",
  description:
    "Browse Veora Wellness classes, available session times, coaches and remaining capacity.",
  alternates: { canonical: "/schedule" },
};

export default async function SchedulePage() {
  const sessions = await getUpcomingSessions(16);

  return (
    <section
      className="mx-auto max-w-7xl px-6 pt-40 pb-16 sm:px-8 sm:pb-20 lg:px-12"
      data-no-text-reveal
    >
      <AnimatedSection className="rounded-[2rem] border border-charcoal/10 bg-cream/60 px-6 py-9 sm:px-9 sm:py-11">
        <p className="text-[11px] font-medium uppercase tracking-[0.24em] text-clay">Schedule</p>
        <h1 className="font-display balance mt-3 text-4xl leading-none text-charcoal sm:text-5xl md:text-6xl">
          Class Schedule
        </h1>
        <p className="mt-5 max-w-2xl text-[15px] leading-relaxed text-charcoal/65 sm:text-base">
          Choose an upcoming class and reserve your spot. Bookings close at 10:00 PM the evening before class.
        </p>
      </AnimatedSection>

      <div className="mt-10 flex items-start gap-3 rounded-2xl border border-charcoal/10 bg-ivory px-4 py-3.5 text-sm text-charcoal/60 sm:items-center">
        <Clock3 className="mt-0.5 h-4 w-4 shrink-0 text-clay sm:mt-0" aria-hidden />
        <p>Availability is shown below. Classes with three or fewer spots left are marked as filling fast.</p>
      </div>

      {sessions.length > 0 ? (
        <div className="mt-6">
          <UpcomingSessionsList sessions={sessions} />
        </div>
      ) : (
        <div className="mt-6 rounded-[2rem] border border-charcoal/10 bg-ivory px-6 py-12 text-center sm:px-10">
          <h2 className="font-display text-3xl text-charcoal">New class times are coming soon.</h2>
          <p className="mx-auto mt-3 max-w-xl text-sm leading-relaxed text-charcoal/60">
            We&rsquo;re preparing the next schedule. Explore the class options now and check back for available dates.
          </p>
          <Button href="/services" variant="secondary" className="mt-6">
            Explore All Classes
          </Button>
        </div>
      )}

      <div className="mt-10 flex flex-col items-start justify-between gap-4 border-t border-charcoal/10 pt-7 sm:flex-row sm:items-center">
        <p className="text-sm text-charcoal/55">Not sure which class is right for you?</p>
        <Button href="/services" variant="secondary">
          Explore All Classes
        </Button>
      </div>
    </section>
  );
}
