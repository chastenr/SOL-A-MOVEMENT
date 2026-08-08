import type { Metadata } from "next";
import { getWeekSchedule, isSessionUpcoming } from "@/data/schedule";
import { AnimatedSection } from "@/components/ui/AnimatedSection";
import { SectionHeading } from "@/components/ui/SectionHeading";
import { ScheduleView } from "@/components/schedule/ScheduleView";

export const metadata: Metadata = {
  title: "Schedule",
  description:
    "View the upcoming SOLÉA Movement & Wellness schedule and book your Pilates, yoga, wellness or private session.",
  alternates: { canonical: "/schedule" },
};

export default function SchedulePage() {
  const now = new Date();
  const sessions = [...getWeekSchedule(now, 0), ...getWeekSchedule(now, 1)]
    .filter((session) => isSessionUpcoming(session, now))
    .map((session) => ({
      id: session.id,
      date: session.date.toISOString(),
      time: session.time,
      duration: session.duration,
      instructor: session.instructor,
      spots: session.spots,
      service: session.service,
    }));

  return (
    <section className="mx-auto max-w-7xl px-6 pt-40 pb-24 sm:px-8 sm:pb-32 lg:px-12">
      <AnimatedSection>
        <SectionHeading
          eyebrow="This Week at SOLÉA"
          heading="Find your next session."
          body="Browse upcoming sessions and reserve your spot. Filter by category, then continue to booking with your session pre-selected."
        />
      </AnimatedSection>

      <div className="mt-14">
        <ScheduleView sessions={sessions} />
      </div>
    </section>
  );
}
