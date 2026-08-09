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
            <div className="mt-4 divide-y divide-charcoal/10 rounded-2xl border border-charcoal/10 bg-ivory">
              {sessions.map((session) => {
                const isFull = session.bookedCount >= session.capacity;
                const isUnavailable = !session.bookingEnabled;
                const cutoffPassed = isPastBookingCutoff(new Date(session.startAt));
                const spotsLeft = session.capacity - session.bookedCount;
                const canBook = !isFull && !isUnavailable && !cutoffPassed;
                const arrivalTime = format(getArrivalTime(new Date(session.startAt)), "h:mm a");
                return (
                  <div key={session.id} className="flex items-center justify-between gap-4 px-5 py-4">
                    <div>
                      <p className="text-charcoal">{session.className}</p>
                      <p className="text-sm text-charcoal/55">
                        {format(new Date(session.startAt), "EEEE, MMMM d 'at' h:mm a")} · {session.location}
                      </p>
                      {session.instructor && (
                        <p className="mt-1 flex items-center gap-1.5 text-xs text-charcoal/50">
                          {session.instructorPhotoUrl && (
                            // eslint-disable-next-line @next/next/no-img-element
                            <img
                              src={session.instructorPhotoUrl}
                              alt=""
                              className="h-4 w-4 rounded-full object-cover"
                            />
                          )}
                          Coach {session.instructor}
                        </p>
                      )}
                      <p className="mt-1 text-xs text-charcoal/40">
                        {isUnavailable
                          ? "Unavailable"
                          : isFull
                            ? "Full"
                            : cutoffPassed
                              ? "Booking closed"
                              : `${spotsLeft} spot${spotsLeft === 1 ? "" : "s"} left`}
                      </p>
                      {canBook && <p className="mt-1 text-xs text-charcoal/40">Please arrive by {arrivalTime}.</p>}
                    </div>
                    {selectedPackage &&
                      (!canBook ? (
                        <span className="shrink-0 rounded-full bg-charcoal/10 px-4 py-2 text-[0.68rem] uppercase tracking-[0.15em] text-charcoal/45">
                          {isUnavailable ? "Unavailable" : isFull ? "Full" : "Closed"}
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
                  </div>
                );
              })}
            </div>
          )}
        </>
      )}
    </div>
  );
}
