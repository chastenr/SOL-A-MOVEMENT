import type { Metadata } from "next";
import Link from "next/link";
import { format } from "date-fns";
import { requireUser } from "@/lib/auth/require-role";
import { getCustomerPackages, getEligibleSessions } from "@/lib/customer/account";
import { isPastBookingCutoff } from "@/lib/booking-cutoff";
import { getArrivalTime } from "@/lib/studio-hours";
import { SectionHeading } from "@/components/ui/SectionHeading";
import { Button } from "@/components/ui/Button";
import { cn } from "@/lib/utils";
import { BookSessionButton } from "@/components/account/BookSessionButton";

export const metadata: Metadata = {
  title: "Book a Class",
  robots: { index: false, follow: false },
};

export default async function AccountBookPage({
  searchParams,
}: {
  searchParams: Promise<{ package?: string }>;
}) {
  const user = await requireUser();
  const { package: packageParam } = await searchParams;

  const allPackages = await getCustomerPackages(user.id);
  const activePackages = allPackages.filter((pkg) => pkg.status === "active" && pkg.remainingCredits > 0);
  const selectedPackage = activePackages.find((pkg) => pkg.id === packageParam) ?? activePackages[0];

  const sessions = selectedPackage ? await getEligibleSessions(selectedPackage.id, user.id) : [];
  const sessionsByDay = [...sessions.reduce((groups, session) => {
    const key = format(new Date(session.startAt), "yyyy-MM-dd");
    groups.set(key, [...(groups.get(key) ?? []), session]);
    return groups;
  }, new Map<string, typeof sessions>())];

  return (
    <div>
      <SectionHeading eyebrow="Book a Class" heading="Choose a session." />

      {activePackages.length === 0 ? (
        <div className="mt-8 rounded-2xl border border-charcoal/10 bg-ivory p-8 text-center">
          <p className="text-charcoal/60">You don&rsquo;t have an active package with credits available.</p>
          <Button href="/pricing" className="mt-4">
            View Packages
          </Button>
        </div>
      ) : (
        <>
          {activePackages.length > 1 && (
            <div className="mt-6 flex flex-wrap gap-2">
              {activePackages.map((pkg) => (
                <Link
                  key={pkg.id}
                  href={`/account/book?package=${pkg.id}`}
                  className={cn(
                    "rounded-full px-4 py-1.5 text-sm transition-colors",
                    selectedPackage?.id === pkg.id ? "bg-charcoal text-ivory" : "border border-charcoal/15 hover:bg-charcoal/5"
                  )}
                >
                  {pkg.packageName} ({pkg.remainingCredits} credit{pkg.remainingCredits === 1 ? "" : "s"} left)
                </Link>
              ))}
            </div>
          )}

          <p className="mt-6 text-xs text-charcoal/45">
            One credit is deducted from your package the moment a reservation is confirmed. Bookings close
            at 10:00 PM the evening before class. If Veora needs to cancel a class, your credit is
            automatically returned.
          </p>

          {selectedPackage && (
            <p className="mt-2 text-xs text-charcoal/45">
              Showing classes your <strong>{selectedPackage.packageName}</strong> credits can be used on.
            </p>
          )}

          {sessions.length === 0 ? (
            <p className="mt-8 text-charcoal/60">
              No upcoming sessions are scheduled for this package yet — check back soon.
            </p>
          ) : (
            <div className="mt-7 space-y-8">
              {sessionsByDay.map(([day, daySessions]) => (
                <section key={day} aria-labelledby={`sessions-${day}`}>
                  <div className="mb-3 flex items-end justify-between gap-3">
                    <div>
                      <p className="text-xs uppercase tracking-[0.14em] text-clay">
                        {format(new Date(`${day}T12:00:00`), "EEEE")}
                      </p>
                      <h2 id={`sessions-${day}`} className="font-display text-xl text-charcoal">
                        {format(new Date(`${day}T12:00:00`), "MMMM d, yyyy")}
                      </h2>
                    </div>
                    <p className="text-xs text-charcoal/40">
                      {daySessions.length} time{daySessions.length === 1 ? "" : "s"}
                    </p>
                  </div>

                  <div className="grid gap-3 md:grid-cols-2">
                    {daySessions.map((session) => {
                      const isFull = session.bookedCount >= session.capacity;
                      const isUnavailable = !session.bookingEnabled;
                      const cutoffPassed = isPastBookingCutoff(new Date(session.startAt));
                      const spotsLeft = session.capacity - session.bookedCount;
                      const canBook = !isFull && !isUnavailable && !cutoffPassed;
                      const arrivalTime = format(getArrivalTime(new Date(session.startAt)), "h:mm a");
                      return (
                        <article
                          key={session.id}
                          className="flex flex-col justify-between gap-5 rounded-2xl border border-charcoal/10 bg-ivory p-5"
                        >
                          <div>
                            <div className="flex items-start justify-between gap-3">
                              <div>
                                <p className="font-display text-2xl text-charcoal">
                                  {format(new Date(session.startAt), "h:mm a")}
                                </p>
                                <p className="mt-1 text-charcoal">{session.className}</p>
                              </div>
                              <span className="rounded-full bg-cream/70 px-3 py-1 text-[0.65rem] uppercase tracking-[0.12em] text-charcoal/55">
                                {isUnavailable
                                  ? "Unavailable"
                                  : isFull
                                    ? "Full"
                                    : cutoffPassed
                                      ? "Closed"
                                      : `${spotsLeft} spot${spotsLeft === 1 ? "" : "s"}`}
                              </span>
                            </div>
                            <p className="mt-3 text-sm text-charcoal/55">{session.location}</p>
                            <p className="mt-1 flex items-center gap-2 text-sm text-charcoal/65">
                              {session.instructorPhotoUrl && (
                                // eslint-disable-next-line @next/next/no-img-element
                                <img
                                  src={session.instructorPhotoUrl}
                                  alt=""
                                  className="h-6 w-6 rounded-full object-cover"
                                />
                              )}
                              Coach {session.instructor ?? "To be announced"}
                            </p>
                            {canBook && (
                              <p className="mt-2 text-xs text-charcoal/40">Please arrive by {arrivalTime}.</p>
                            )}
                          </div>

                          {selectedPackage &&
                            (!canBook ? (
                              <span className="self-start rounded-full bg-charcoal/10 px-4 py-2 text-[0.68rem] uppercase tracking-[0.15em] text-charcoal/45">
                                {isUnavailable ? "Unavailable" : isFull ? "Full" : "Booking Closed"}
                              </span>
                            ) : (
                              <BookSessionButton
                                classSessionId={session.id}
                                customerPackageId={selectedPackage.id}
                                sessionName={session.className}
                                coachName={session.instructor ?? "TBA"}
                                scheduleLabel={`${format(new Date(session.startAt), "EEEE, MMMM d 'at' h:mm a")} · ${session.location}`}
                                formattedDate={format(new Date(session.startAt), "EEEE, MMMM d, yyyy")}
                                timeRange={`${format(new Date(session.startAt), "h:mm a")} – ${format(new Date(session.endAt), "h:mm a")}`}
                                arrivalTime={arrivalTime}
                                packageName={selectedPackage.packageName}
                              />
                            ))}
                        </article>
                      );
                    })}
                  </div>
                </section>
              ))}
            </div>
          )}
        </>
      )}
    </div>
  );
}
