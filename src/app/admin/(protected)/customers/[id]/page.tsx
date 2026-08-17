import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { format } from "date-fns";
import { requireAdmin } from "@/lib/auth/require-role";
import {
  getAdminCustomerDetail,
  getCustomerPackagesForAdmin,
  getCustomerPurchasesForAdmin,
  getGrantablePackages,
} from "@/lib/admin/customers";
import { centavosToPeso } from "@/lib/money";
import { AdjustCreditsForm } from "@/components/admin/AdjustCreditsForm";
import { GrantPackageForm } from "@/components/admin/GrantPackageForm";
import { getCustomerBookings, getCustomerMemberships } from "@/lib/customer/account";
import { formatManilaDateTime } from "@/lib/manila-time";

export const metadata: Metadata = {
  title: "Customer",
  robots: { index: false, follow: false },
};

export default async function AdminCustomerDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const admin = await requireAdmin();
  const { id } = await params;

  const customer = await getAdminCustomerDetail(id);
  if (!customer) notFound();

  const [packages, purchases, grantablePackages, memberships, bookings] = await Promise.all([
    getCustomerPackagesForAdmin(id),
    admin.role === "super_admin" ? getCustomerPurchasesForAdmin(id) : Promise.resolve([]),
    getGrantablePackages(),
    getCustomerMemberships(id),
    getCustomerBookings(id),
  ]);

  return (
    <div>
      <h1 className="font-display text-2xl text-charcoal">{`${customer.firstName} ${customer.lastName}`.trim()}</h1>
      <p className="mt-1 text-sm text-charcoal/55">
        Member VEO-{String(customer.customerNumber).padStart(6, "0")} · {customer.email}{" "}
        {customer.mobileNumber && `· ${customer.mobileNumber}`} · Joined{" "}
        {format(new Date(customer.createdAt), "MMM d, yyyy")}
      </p>

      <section className="mt-10">
        <h2 className="font-display text-lg text-charcoal">Packages &amp; Credits</h2>
        <p className="mt-1 text-sm text-charcoal/55">
          Update the available balance for a specific package. Every change requires a reason and is saved in the credit history.
        </p>
        {packages.length === 0 ? (
          <div className="mt-4 rounded-xl border border-dashed border-charcoal/15 bg-ivory p-4">
            <p className="text-sm text-charcoal/60">
              This customer has no package to update yet. Grant a package below to give them credits.
            </p>
          </div>
        ) : (
          <div className="mt-4 space-y-3">
            {packages.map((pkg) => (
              <div key={pkg.id} className="rounded-xl border border-charcoal/10 bg-ivory p-4">
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <p className="text-charcoal">{pkg.packageName}</p>
                    <p className="text-sm text-charcoal/60">
                      {pkg.remainingCredits} / {pkg.creditCount} credits remaining ·{" "}
                      <span className="capitalize">{pkg.status}</span>
                      {pkg.expiresAt && ` · expires ${format(new Date(pkg.expiresAt), "MMM d, yyyy")}`}
                    </p>
                  </div>
                </div>
                <div className="mt-3">
                  {pkg.status === "active" || pkg.status === "exhausted" ? (
                    <AdjustCreditsForm
                      customerPackageId={pkg.id}
                      currentCredits={pkg.remainingCredits}
                      maximumCredits={pkg.creditCount}
                      packageName={pkg.packageName}
                    />
                  ) : (
                    <p className="text-xs text-charcoal/45">Expired packages cannot be given new credits.</p>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </section>

      <section className="mt-10">
        <h2 className="font-display text-lg text-charcoal">Unlimited Memberships</h2>
        {memberships.length === 0 ? (
          <p className="mt-3 text-sm text-charcoal/55">No membership history.</p>
        ) : (
          <div className="mt-4 space-y-3">
            {memberships.map((membership) => (
              <div key={membership.id} className="rounded-xl border border-charcoal/10 bg-ivory p-4">
                <p className="text-charcoal">{membership.membershipName}</p>
                <p className="mt-1 text-sm text-charcoal/60">
                  <span className="capitalize">{membership.status}</span> · {format(new Date(membership.startsAt), "MMM d, yyyy")}–{format(new Date(membership.expiresAt), "MMM d, yyyy")}
                </p>
              </div>
            ))}
          </div>
        )}
      </section>

      <section className="mt-10">
        <h2 className="font-display text-lg text-charcoal">Bookings</h2>
        {bookings.length === 0 ? (
          <p className="mt-3 text-sm text-charcoal/55">No booking history.</p>
        ) : (
          <div className="mt-4 overflow-x-auto rounded-xl border border-charcoal/10 bg-ivory">
            <table className="w-full min-w-[680px] text-left text-sm">
              <thead className="border-b border-charcoal/10 text-xs uppercase tracking-[0.08em] text-charcoal/45">
                <tr><th className="px-4 py-3">Class</th><th className="px-4 py-3">Schedule</th><th className="px-4 py-3">Entitlement</th><th className="px-4 py-3">Status</th></tr>
              </thead>
              <tbody>
                {bookings.map((booking) => (
                  <tr key={booking.id} className="border-b border-charcoal/5 last:border-0">
                    <td className="px-4 py-3 text-charcoal">{booking.session?.className ?? "—"}</td>
                    <td className="px-4 py-3 text-charcoal/70">{booking.session ? formatManilaDateTime(booking.session.startAt) : "—"}</td>
                    <td className="px-4 py-3 text-charcoal/70">{booking.packageName ?? "—"}</td>
                    <td className="px-4 py-3 capitalize text-charcoal/70">{booking.status.replace("_", " ")}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>

      <section className="mt-10">
        <h2 className="font-display text-lg text-charcoal">Grant a Package</h2>
        <p className="mt-1 text-sm text-charcoal/55">Give this customer a package for free — credits activate immediately.</p>
        <div className="mt-4 rounded-xl border border-charcoal/10 bg-ivory p-4">
          <GrantPackageForm userId={id} packages={grantablePackages} />
        </div>
      </section>

      {admin.role === "super_admin" && <section className="mt-10">
        <h2 className="font-display text-lg text-charcoal">Payment History</h2>
        {purchases.length === 0 ? (
          <p className="mt-3 text-sm text-charcoal/55">No purchases yet.</p>
        ) : (
          <div className="mt-4 overflow-x-auto rounded-xl border border-charcoal/10 bg-ivory">
            <table className="w-full min-w-[600px] text-left text-sm">
              <thead className="border-b border-charcoal/10 text-xs uppercase tracking-[0.08em] text-charcoal/45">
                <tr>
                  <th className="px-4 py-3">Reference</th>
                  <th className="px-4 py-3">Package</th>
                  <th className="px-4 py-3">Credits</th>
                  <th className="px-4 py-3">Amount</th>
                  <th className="px-4 py-3">Status</th>
                  <th className="px-4 py-3">Date</th>
                </tr>
              </thead>
              <tbody>
                {purchases.map((purchase) => (
                  <tr key={purchase.id} className="border-b border-charcoal/5 last:border-0">
                    <td className="px-4 py-3 text-charcoal/70">{purchase.referenceNumber}</td>
                    <td className="px-4 py-3 text-charcoal">{purchase.packageName}</td>
                    <td className="px-4 py-3 text-charcoal/70">{purchase.creditCount ?? "—"}</td>
                    <td className="px-4 py-3 text-charcoal/70">{centavosToPeso(purchase.amountCentavos)}</td>
                    <td className="px-4 py-3 text-charcoal/70 capitalize">{purchase.status.replace("_", " ")}</td>
                    <td className="px-4 py-3 text-charcoal/70">{format(new Date(purchase.createdAt), "MMM d, yyyy")}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>}
    </div>
  );
}
