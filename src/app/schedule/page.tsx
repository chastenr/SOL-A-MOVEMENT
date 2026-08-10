import type { Metadata } from "next";
import { classDirectory } from "@/data/schedule";
import { getUpcomingSessions } from "@/lib/catalog/sessions";
import { getAuthedUser } from "@/lib/auth/require-role";
import { AnimatedSection } from "@/components/ui/AnimatedSection";
import { SectionHeading } from "@/components/ui/SectionHeading";
import { ScheduleView } from "@/components/schedule/ScheduleView";
import { UpcomingSessionsList } from "@/components/schedule/UpcomingSessionsList";

export const metadata: Metadata = {
  title: "Schedule",
  description:
    "Browse Veora Wellness classes, available session times, coaches and remaining capacity.",
  alternates: { canonical: "/schedule" },
};

export default async function SchedulePage() {
  const [sessions, user] = await Promise.all([getUpcomingSessions(), getAuthedUser()]);
  const bookHref = user ? "/account/book" : "/login?redirectTo=%2Faccount%2Fbook";

  return (
    <section className="mx-auto max-w-7xl px-6 pt-28 pb-16 sm:px-8 sm:pb-20 lg:px-12">
      <AnimatedSection>
        <SectionHeading
          eyebrow="Our Classes"
          heading="Find your next class."
          body={
            sessions.length > 0
              ? "Reserve a spot in an upcoming session below, or browse everything we offer by category. Bookings close at 10:00 PM the evening before class."
              : "The next class times are being prepared. Browse every class below, then sign in once the member timetable is available to choose your date, time and coach."
          }
        />
      </AnimatedSection>

      {sessions.length > 0 && (
        <div className="mt-10">
          <p className="text-xs uppercase tracking-[0.15em] text-charcoal/45">Upcoming Sessions</p>
          <div className="mt-4">
            <UpcomingSessionsList sessions={sessions} bookHref={bookHref} />
          </div>
        </div>
      )}

      <div className="mt-14">
        <ScheduleView entries={classDirectory} />
      </div>
    </section>
  );
}
