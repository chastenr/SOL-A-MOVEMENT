import type { Metadata } from "next";
import Link from "next/link";
import { requireUser } from "@/lib/auth/require-role";
import { getCustomerPackages, getEligibleSessions } from "@/lib/customer/account";
import { SectionHeading } from "@/components/ui/SectionHeading";
import { Button } from "@/components/ui/Button";
import { cn } from "@/lib/utils";
import { ScheduleExplorer } from "@/components/schedule/ScheduleExplorer";

export const metadata: Metadata = {
  title: "Book a Class",
  robots: { index: false, follow: false },
};

export default async function AccountBookPage({
  searchParams,
}: {
  searchParams: Promise<{ package?: string; service?: string; class?: string; session?: string }>;
}) {
  const user = await requireUser();
  const {
    package: packageParam,
    service: requestedService,
    class: requestedClass,
    session: requestedSession,
  } = await searchParams;

  const allPackages = await getCustomerPackages(user.id);
  const activePackages = allPackages.filter((pkg) => pkg.status === "active" && pkg.remainingCredits > 0);
  const requestedPackage = requestedService
    ? activePackages.find((pkg) =>
        requestedService === "recovery-restore" || requestedService === "ballet"
          ? pkg.serviceSlug === requestedService
          : pkg.serviceSlug === null
      )
    : undefined;
  const selectedPackage = activePackages.find((pkg) => pkg.id === packageParam) ?? requestedPackage ?? activePackages[0];

  const eligibleSessions = selectedPackage ? await getEligibleSessions(selectedPackage.id, user.id) : [];
  const sessions = requestedSession
    ? eligibleSessions.filter((session) => session.id === requestedSession)
    : requestedClass
      ? eligibleSessions.filter((session) => session.classSlug === requestedClass)
      : requestedService
        ? eligibleSessions.filter((session) => session.serviceSlug === requestedService)
        : eligibleSessions;

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
                  href={`/account/book?${new URLSearchParams({
                    package: pkg.id,
                    ...(requestedService ? { service: requestedService } : {}),
                    ...(requestedClass ? { class: requestedClass } : {}),
                    ...(requestedSession ? { session: requestedSession } : {}),
                  }).toString()}`}
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
            <div className="mt-8">
              <p className="text-charcoal/60">
                {requestedSession || requestedClass
                  ? "This class is not available with the selected package. Choose another package or view all available classes."
                  : "No upcoming sessions are scheduled for this package yet — check back soon."}
              </p>
              {(requestedSession || requestedClass) && (
                <Link href="/account/book" className="mt-3 inline-block text-sm underline underline-offset-4">
                  View all available classes
                </Link>
              )}
            </div>
          ) : selectedPackage ? (
            <div className="mt-7">
              <ScheduleExplorer
                sessions={sessions}
                memberPackage={{ id: selectedPackage.id, name: selectedPackage.packageName }}
              />
            </div>
          ) : null}
        </>
      )}
    </div>
  );
}
