import type { Metadata } from "next";
import { format } from "date-fns";
import { requireUser } from "@/lib/auth/require-role";
import { getCustomerPackages } from "@/lib/customer/account";
import { SectionHeading } from "@/components/ui/SectionHeading";
import { Button } from "@/components/ui/Button";

export const metadata: Metadata = {
  title: "My Packages",
  robots: { index: false, follow: false },
};

const STATUS_LABEL: Record<string, string> = {
  active: "Active",
  exhausted: "Used Up",
  expired: "Expired",
  revoked: "Revoked",
};

export default async function AccountPackagesPage() {
  const user = await requireUser();
  const packages = await getCustomerPackages(user.id);

  return (
    <div>
      <SectionHeading eyebrow="My Packages" heading="Your credit packages." />

      {packages.length === 0 ? (
        <div className="mt-8 rounded-2xl border border-charcoal/10 bg-ivory p-8 text-center">
          <p className="text-charcoal/60">You don&rsquo;t have any packages yet.</p>
          <Button href="/pricing" className="mt-4">
            View Packages
          </Button>
        </div>
      ) : (
        <div className="mt-8 grid gap-4 sm:grid-cols-2">
          {packages.map((pkg) => (
            <div key={pkg.id} className="rounded-2xl border border-charcoal/10 bg-ivory p-6">
              <div className="flex items-start justify-between gap-3">
                <p className="font-display text-lg text-charcoal">{pkg.packageName}</p>
                <span className="shrink-0 rounded-full bg-cream px-2.5 py-1 text-xs text-charcoal/60">
                  {STATUS_LABEL[pkg.status] ?? pkg.status}
                </span>
              </div>
              <p className="mt-3 text-2xl font-display text-charcoal">
                {pkg.remainingCredits} / {pkg.creditCount}
              </p>
              <p className="text-xs uppercase tracking-[0.1em] text-charcoal/45">Credits Remaining</p>
              <dl className="mt-4 space-y-1 text-sm">
                {pkg.activatedAt && (
                  <div className="flex justify-between">
                    <dt className="text-charcoal/55">Activated</dt>
                    <dd className="text-charcoal">{format(new Date(pkg.activatedAt), "MMM d, yyyy")}</dd>
                  </div>
                )}
                {pkg.expiresAt && (
                  <div className="flex justify-between">
                    <dt className="text-charcoal/55">Expires</dt>
                    <dd className="text-charcoal">{format(new Date(pkg.expiresAt), "MMM d, yyyy")}</dd>
                  </div>
                )}
              </dl>
              {pkg.status === "active" && (
                <Button href="/account/book" variant="secondary" size="md" className="mt-4">
                  Book a Class
                </Button>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
