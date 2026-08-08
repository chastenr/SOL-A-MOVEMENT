import type { Metadata } from "next";
import { classDirectory } from "@/data/schedule";
import { AnimatedSection } from "@/components/ui/AnimatedSection";
import { SectionHeading } from "@/components/ui/SectionHeading";
import { ScheduleView } from "@/components/schedule/ScheduleView";

export const metadata: Metadata = {
  title: "Schedule",
  description:
    "Browse every class Veora Wellness offers — Pilates, yoga, barre, strength, recovery and ballet — and request your booking.",
  alternates: { canonical: "/schedule" },
};

export default function SchedulePage() {
  return (
    <section className="mx-auto max-w-7xl px-6 pt-28 pb-16 sm:px-8 sm:pb-20 lg:px-12">
      <AnimatedSection>
        <SectionHeading
          eyebrow="Our Classes"
          heading="Find your next class."
          body="Veora is preparing to open, so a live weekly timetable isn't published yet. Browse every class we offer below, filter by category, and request your booking — we'll follow up to confirm your date and time."
        />
      </AnimatedSection>

      <div className="mt-14">
        <ScheduleView entries={classDirectory} />
      </div>
    </section>
  );
}
