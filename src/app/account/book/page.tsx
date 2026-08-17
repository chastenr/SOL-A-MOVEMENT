import type { Metadata } from "next";
import Link from "next/link";
import { requireUser } from "@/lib/auth/require-role";
import {
  getCustomerPackages,
  getCustomerMemberships,
  getEligibleSessions,
  getEligibleSessionsForMembership,
  getCustomerBookedSessionIds,
} from "@/lib/customer/account";
import { SectionHeading } from "@/components/ui/SectionHeading";
import { Button } from "@/components/ui/Button";
import { cn } from "@/lib/utils";
import { ScheduleExplorer } from "@/components/schedule/ScheduleExplorer";
import { getServiceBySlug } from "@/data/services";
import { getUpcomingSessions } from "@/lib/catalog/sessions";

export const metadata: Metadata = {
  title: "Book a Class",
  robots: { index: false, follow: false },
};

const CLASSIC_SERVICE_SLUGS = ["mat-pilates", "yoga", "barre", "strength-hiit"];

function packageSupportsService(serviceSlug: string | null, requestedService: string): boolean {
  if (requestedService === "recovery-restore" || requestedService === "ballet") {
    return serviceSlug === requestedService;
  }
  return serviceSlug === null && CLASSIC_SERVICE_SLUGS.includes(requestedService);
}

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

  const [allPackages, allMemberships, bookedSessionIds] = await Promise.all([
    getCustomerPackages(user.id),
    getCustomerMemberships(user.id),
    getCustomerBookedSessionIds(user.id),
  ]);
  const activePackages = allPackages.filter((pkg) => pkg.status === "active" && pkg.remainingCredits > 0);
  const activeMembership = allMemberships.find(
    (membership) =>
      membership.isCurrentlyActive
  );
  const requestedPackage = requestedService
    ? activePackages.find((pkg) => packageSupportsService(pkg.serviceSlug, requestedService))
    : undefined;
  const selectedPackage = activePackages.find((pkg) => pkg.id === packageParam) ?? requestedPackage ?? activePackages[0];
  const packageMismatch = Boolean(
    requestedService && selectedPackage && !packageSupportsService(selectedPackage.serviceSlug, requestedService)
  );
  const requestedServiceName = requestedService
    ? getServiceBySlug(requestedService)?.name ?? "this class type"
    : null;

  const eligibleSessions = selectedPackage && !packageMismatch
    ? await getEligibleSessions(selectedPackage.id, user.id)
    : activeMembership
      ? await getEligibleSessionsForMembership(activeMembership.id, user.id)
      : [];
  const sessions = requestedSession
    ? eligibleSessions.filter((session) => session.id === requestedSession)
    : requestedClass
      ? eligibleSessions.filter((session) => session.classSlug === requestedClass)
      : requestedService
        ? eligibleSessions.filter((session) => session.serviceSlug === requestedService)
        : eligibleSessions;
  const shouldShowScheduleFallback = packageMismatch || sessions.length === 0;
  const fallbackSessions = shouldShowScheduleFallback ? await getUpcomingSessions(100) : [];
  const fallbackPackagesBySessionId = Object.fromEntries(
    fallbackSessions.flatMap((session) => {
      if (activeMembership) {
        return [[session.id, {
          id: activeMembership.id,
          name: activeMembership.membershipName,
          entitlementType: "membership" as const,
        }]];
      }
      const compatiblePackage = activePackages.find((pkg) => packageSupportsService(pkg.serviceSlug, session.serviceSlug));
      return compatiblePackage ? [[session.id, { id: compatiblePackage.id, name: compatiblePackage.packageName }]] : [];
    })
  );

  return (
    <div>
      <SectionHeading eyebrow="Book a Class" heading="Choose a session." />

      {activePackages.length === 0 && !activeMembership ? (
        <div className="mt-8 rounded-2xl border border-charcoal/10 bg-ivory p-8 text-center">
          <p className="text-charcoal/60">You don&rsquo;t have an active package with credits available.</p>
          <Button href="/pricing" className="mt-4">
            View Packages
          </Button>
        </div>
      ) : (
        <>
          {selectedPackage && (
            <div className="mt-7 flex flex-col gap-5 rounded-2xl border border-charcoal/10 bg-ivory p-5 shadow-[0_18px_45px_-40px_rgba(34,31,28,0.55)] sm:flex-row sm:items-center sm:justify-between sm:p-6">
              <div>
                <p className="text-[10px] font-medium uppercase tracking-[0.18em] text-clay">
                  Available class credits
                </p>
                <div className="mt-2 flex items-baseline gap-2">
                  <p className="text-4xl font-semibold leading-none text-charcoal">
                    {selectedPackage.remainingCredits}
                  </p>
                  <p className="text-sm text-charcoal/50">
                    of {selectedPackage.creditCount} remaining
                  </p>
                </div>
                <p className="mt-2 text-sm text-charcoal/65">{selectedPackage.packageName}</p>
              </div>
              <Button href="/account/packages" variant="secondary" size="md">
                View My Packages
              </Button>
            </div>
          )}

          {!selectedPackage && activeMembership && (
            <div className="mt-7 rounded-2xl border border-clay/25 bg-clay/8 p-5 sm:p-6">
              <p className="text-[10px] font-medium uppercase tracking-[0.18em] text-clay">Active unlimited membership</p>
              <p className="font-display mt-2 text-3xl text-charcoal">{activeMembership.membershipName}</p>
              <p className="mt-2 text-sm text-charcoal/65">
                No class credits are deducted. Normal capacity, duplicate-booking, and booking-cutoff rules still apply.
              </p>
            </div>
          )}

          {activePackages.length > 1 && (
            <div className="mt-4 flex flex-wrap gap-2">
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

          {packageMismatch && selectedPackage ? (
            <>
              <div className="mt-6 rounded-2xl border border-amber-300/60 bg-amber-50 p-6 text-amber-950">
                <p className="font-semibold">This package does not cover {requestedServiceName}.</p>
                <p className="mt-2 text-sm leading-relaxed text-amber-900/75">
                  Your {selectedPackage.packageName} credits cannot be used for this class type. You can still
                  browse every available schedule below. Classes covered by one of your active packages can be
                  booked immediately.
                </p>
                <div className="mt-4 flex flex-wrap gap-3">
                  <Button href="/pricing" size="md">View Compatible Packages</Button>
                  <Button href="/account/book" variant="secondary" size="md">Clear Class Filter</Button>
                </div>
              </div>

              <AvailableScheduleFallback
                sessions={fallbackSessions}
                memberPackagesBySessionId={fallbackPackagesBySessionId}
                bookedSessionIds={bookedSessionIds}
              />
            </>
          ) : (
            <>
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
                <>
                  <div className="mt-8 rounded-2xl border border-dashed border-charcoal/15 bg-cream/25 p-6 sm:p-8">
                    <p className="font-medium text-charcoal">
                      {requestedSession || requestedClass || requestedService
                        ? `${requestedServiceName ?? "This class"} has no upcoming times right now.`
                        : "There are no upcoming classes covered by this package right now."}
                    </p>
                    <p className="mt-2 max-w-2xl text-sm leading-relaxed text-charcoal/55">
                      Here are all other available studio schedules so you can choose another class or date.
                    </p>
                  </div>

                  <AvailableScheduleFallback
                    sessions={fallbackSessions}
                    memberPackagesBySessionId={fallbackPackagesBySessionId}
                    bookedSessionIds={bookedSessionIds}
                  />
                </>
              ) : selectedPackage || activeMembership ? (
                <div className="mt-7">
                  <ScheduleExplorer
                    sessions={sessions}
                    memberPackage={selectedPackage
                      ? { id: selectedPackage.id, name: selectedPackage.packageName }
                      : {
                          id: activeMembership!.id,
                          name: activeMembership!.membershipName,
                          entitlementType: "membership",
                        }}
                    bookedSessionIds={bookedSessionIds}
                  />
                </div>
              ) : null}
            </>
          )}
        </>
      )}
    </div>
  );
}

function AvailableScheduleFallback({
  sessions,
  memberPackagesBySessionId,
  bookedSessionIds,
}: {
  sessions: Awaited<ReturnType<typeof getUpcomingSessions>>;
  memberPackagesBySessionId: Record<string, { id: string; name: string; entitlementType?: "credits" | "membership" }>;
  bookedSessionIds: string[];
}) {
  if (sessions.length === 0) {
    return (
      <div className="mt-6 rounded-2xl border border-charcoal/10 bg-ivory p-6 text-center sm:p-8">
        <p className="font-medium text-charcoal">No upcoming studio schedules have been published yet.</p>
        <p className="mt-2 text-sm text-charcoal/55">New class dates and times will appear here automatically.</p>
      </div>
    );
  }

  return (
    <section className="mt-8" aria-labelledby="other-schedules-heading">
      <div className="mb-5">
        <p className="text-[10px] font-medium uppercase tracking-[0.2em] text-clay">Available alternatives</p>
        <h2 id="other-schedules-heading" className="font-display mt-1 text-3xl text-charcoal">
          All upcoming class times
        </h2>
        <p className="mt-2 text-sm leading-relaxed text-charcoal/55">
          Select any date and time to review the class and coach. If your current credits do not cover it,
          you&rsquo;ll see the package options instead of a booking button.
        </p>
      </div>
      <ScheduleExplorer
        sessions={sessions}
        memberPackagesBySessionId={memberPackagesBySessionId}
        uncoveredSessionHref="/pricing"
        bookedSessionIds={bookedSessionIds}
      />
    </section>
  );
}
