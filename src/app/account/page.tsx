import type { Metadata } from "next";
import { format } from "date-fns";
import { requireUser } from "@/lib/auth/require-role";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { getCustomerPackages, getCustomerBookings, getCustomerPurchases } from "@/lib/customer/account";
import { centavosToPeso } from "@/lib/money";
import { AnimatedSection } from "@/components/ui/AnimatedSection";
import { SectionHeading } from "@/components/ui/SectionHeading";
import { Button } from "@/components/ui/Button";
import { logoutAction } from "@/lib/auth/actions";
import { formatManilaFullDateTime } from "@/lib/manila-time";

export const metadata: Metadata = {
  title: "My Account",
  robots: { index: false, follow: false },
};

export default async function AccountPage() {
  const user = await requireUser();
  const supabase = await createSupabaseServerClient();
  const { data: profile } = await supabase.from("profiles").select("first_name").eq("id", user.id).single();

  const [packages, bookings, purchases] = await Promise.all([
    getCustomerPackages(user.id),
    getCustomerBookings(user.id),
    getCustomerPurchases(user.id),
  ]);

  const activePackage = packages.find((pkg) => pkg.status === "active");
  const upcomingBooking = bookings
    .filter((booking) => booking.isUpcoming)
    .sort((a, b) => new Date(a.session!.startAt).getTime() - new Date(b.session!.startAt).getTime())[0];
  const recentPurchase = purchases[0];

  const firstName = profile?.first_name || "there";

  return (
    <div>
      <AnimatedSection className="flex flex-col items-start justify-between gap-6 sm:flex-row sm:items-end">
        <SectionHeading eyebrow="My Account" heading={`Welcome, ${firstName}.`} />
        <form action={logoutAction}>
          <Button type="submit" variant="secondary">
            Log Out
          </Button>
        </form>
      </AnimatedSection>

      <AnimatedSection delay={0.1} className="mt-10 grid gap-6 sm:grid-cols-2">
        <div className="rounded-2xl border border-charcoal/10 bg-ivory p-6">
          <p className="text-xs uppercase tracking-[0.14em] text-charcoal/45">Active Package</p>
          {activePackage ? (
            <>
              <p className="mt-3 text-charcoal">{activePackage.packageName}</p>
              <p className="mt-1 text-sm text-charcoal/60">
                {activePackage.remainingCredits} / {activePackage.creditCount} credits remaining
              </p>
              {activePackage.expiresAt && (
                <p className="text-sm text-charcoal/60">
                  Expires {format(new Date(activePackage.expiresAt), "MMMM d, yyyy")}
                </p>
              )}
              <Button href="/account/book" variant="secondary" size="md" className="mt-4">
                Book a Class
              </Button>
            </>
          ) : (
            <>
              <p className="mt-3 text-charcoal/70">You don&rsquo;t have an active package yet.</p>
              <Button href="/pricing" variant="secondary" size="md" className="mt-4">
                View Packages
              </Button>
            </>
          )}
        </div>

        <div className="rounded-2xl border border-charcoal/10 bg-ivory p-6">
          <p className="text-xs uppercase tracking-[0.14em] text-charcoal/45">Upcoming Booking</p>
          {upcomingBooking?.session ? (
            <>
              <p className="mt-3 text-charcoal">{upcomingBooking.session.className}</p>
              <p className="text-sm text-charcoal/60">
                {formatManilaFullDateTime(upcomingBooking.session.startAt)}
              </p>
              <p className="text-sm text-charcoal/60">{upcomingBooking.session.location}</p>
            </>
          ) : (
            <>
              <p className="mt-3 text-charcoal/70">No upcoming classes.</p>
              <Button href="/account/book" variant="secondary" size="md" className="mt-4">
                Book a Class
              </Button>
            </>
          )}
        </div>
      </AnimatedSection>

      {recentPurchase && (
        <AnimatedSection delay={0.15} className="mt-10 rounded-2xl border border-charcoal/10 bg-cream/40 p-6">
          <p className="text-xs uppercase tracking-[0.14em] text-charcoal/45">Recent Purchase</p>
          <div className="mt-3 flex items-center justify-between">
            <div>
              <p className="text-charcoal">{recentPurchase.packageName}</p>
              <p className="text-sm text-charcoal/60">{recentPurchase.referenceNumber}</p>
            </div>
            <p className="text-charcoal">{centavosToPeso(recentPurchase.amountCentavos)}</p>
          </div>
        </AnimatedSection>
      )}
    </div>
  );
}
