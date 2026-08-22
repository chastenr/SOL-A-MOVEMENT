import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { CheckCircle2, ChevronDown, History, Layers3, TicketCheck } from "lucide-react";
import { requireAdmin } from "@/lib/auth/require-role";
import {
  getAdminCustomerDetail,
  getCustomerPackagesForAdmin,
  getCustomerPurchasesForAdmin,
  getGrantablePackages,
  type AdminCustomerPackageRow,
} from "@/lib/admin/customers";
import { centavosToPeso } from "@/lib/money";
import { AdjustCreditsForm } from "@/components/admin/AdjustCreditsForm";
import { GrantPackageForm } from "@/components/admin/GrantPackageForm";
import { getCustomerBookings, getCustomerMemberships } from "@/lib/customer/account";
import { formatManilaDate, formatManilaDateTime } from "@/lib/manila-time";
import { cn } from "@/lib/utils";

export const metadata: Metadata = {
  title: "Customer",
  robots: { index: false, follow: false },
};

type PackageGroup = {
  name: string;
  packages: AdminCustomerPackageRow[];
  remainingCredits: number;
  totalCredits: number;
};

function groupEditablePackages(packages: AdminCustomerPackageRow[]): PackageGroup[] {
  const groups = new Map<string, PackageGroup>();

  for (const pkg of packages.filter((item) => item.status === "active" || item.status === "exhausted")) {
    const group = groups.get(pkg.packageName) ?? {
      name: pkg.packageName,
      packages: [],
      remainingCredits: 0,
      totalCredits: 0,
    };
    group.packages.push(pkg);
    group.remainingCredits += pkg.remainingCredits;
    group.totalCredits += pkg.creditCount;
    groups.set(pkg.packageName, group);
  }

  return [...groups.values()];
}

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
  const packageGroups = groupEditablePackages(packages);
  const archivedPackages = packages.filter((pkg) => pkg.status !== "active" && pkg.status !== "exhausted");
  const totalAvailableCredits = packageGroups.reduce((total, group) => total + group.remainingCredits, 0);

  return (
    <div>
      <h1 className="font-display text-2xl text-charcoal">{`${customer.firstName} ${customer.lastName}`.trim()}</h1>
      <p className="mt-1 text-sm text-charcoal/55">
        Member VEO-{String(customer.customerNumber).padStart(6, "0")} · {customer.email}{" "}
        {customer.mobileNumber && `· ${customer.mobileNumber}`} · Joined{" "}
        {formatManilaDate(customer.createdAt)}
      </p>

      <section className="mt-10">
        <div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <p className="text-xs font-medium uppercase tracking-[0.15em] text-clay">Current balance</p>
            <h2 className="font-display mt-1 text-xl text-charcoal">Packages &amp; Credits</h2>
            <p className="mt-1 text-sm text-charcoal/55">Identical passes are grouped so the usable balance is clear.</p>
          </div>
          {packages.length > 0 && (
            <div className="flex items-center gap-2 rounded-xl bg-clay/10 px-3 py-2 text-clay">
              <TicketCheck size={17} aria-hidden />
              <span className="text-sm font-semibold">{totalAvailableCredits} available credits</span>
            </div>
          )}
        </div>
        {packages.length === 0 ? (
          <div className="mt-4 rounded-xl border border-dashed border-charcoal/15 bg-ivory p-4">
            <p className="text-sm text-charcoal/60">
              This customer has no package to update yet. Grant a package below to give them credits.
            </p>
          </div>
        ) : (
          <div className="mt-4 space-y-4">
            {packageGroups.length === 0 && (
              <div className="rounded-2xl border border-charcoal/10 bg-ivory p-5">
                <p className="text-sm text-charcoal/60">There are no active or refillable packages.</p>
              </div>
            )}

            {packageGroups.map((group) => {
              const activeCount = group.packages.filter((pkg) => pkg.status === "active").length;
              const expiryDates = [...new Set(group.packages.map((pkg) => pkg.expiresAt).filter(Boolean))] as string[];
              const progress = Math.min(100, Math.round((group.remainingCredits / Math.max(group.totalCredits, 1)) * 100));

              return (
                <article key={group.name} className="overflow-hidden rounded-2xl border border-charcoal/10 bg-ivory">
                  <div className="p-5 sm:p-6">
                    <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                      <div className="flex items-start gap-3">
                        <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-clay/10 text-clay">
                          <Layers3 size={19} strokeWidth={1.8} aria-hidden />
                        </span>
                        <div>
                          <h3 className="font-display text-xl text-charcoal">{group.name}</h3>
                          <p className="mt-1 text-sm text-charcoal/50">
                            {group.packages.length} {group.packages.length === 1 ? "entitlement" : "entitlements"}
                            {expiryDates.length === 1 && ` · expires ${formatManilaDate(expiryDates[0])}`}
                            {expiryDates.length > 1 && ` · ${expiryDates.length} expiry dates`}
                          </p>
                        </div>
                      </div>
                      <div className="sm:text-right">
                        <p className="font-display text-3xl text-charcoal">{group.remainingCredits}</p>
                        <p className="text-xs font-medium uppercase tracking-[0.08em] text-charcoal/45">
                          of {group.totalCredits} credits available
                        </p>
                      </div>
                    </div>

                    <div className="mt-5 h-2 overflow-hidden rounded-full bg-charcoal/[0.07]" aria-hidden>
                      <div className="h-full rounded-full bg-clay" style={{ width: `${progress}%` }} />
                    </div>
                    <div className="mt-3 flex flex-wrap gap-2 text-[10px] font-semibold uppercase tracking-[0.06em]">
                      {activeCount > 0 && (
                        <span className="inline-flex items-center gap-1 rounded-full bg-emerald-100 px-2.5 py-1 text-emerald-700">
                          <CheckCircle2 size={11} aria-hidden /> {activeCount} active
                        </span>
                      )}
                      {group.packages.length - activeCount > 0 && (
                        <span className="rounded-full bg-charcoal/[0.06] px-2.5 py-1 text-charcoal/50">
                          {group.packages.length - activeCount} exhausted
                        </span>
                      )}
                    </div>
                  </div>

                  <details className="group border-t border-charcoal/[0.07]">
                    <summary className="flex min-h-12 cursor-pointer list-none items-center justify-between gap-3 px-5 text-sm font-medium text-charcoal/65 marker:content-none hover:bg-charcoal/[0.02] sm:px-6">
                      Manage individual {group.packages.length === 1 ? "pass" : "passes"}
                      <ChevronDown size={16} className="transition-transform group-open:rotate-180" aria-hidden />
                    </summary>
                    <div className="divide-y divide-charcoal/[0.07] border-t border-charcoal/[0.07]">
                      {group.packages.map((pkg, index) => (
                        <div key={pkg.id} className="p-4 sm:px-6">
                          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                            <div>
                              <div className="flex flex-wrap items-center gap-2">
                                <p className="text-sm font-medium text-charcoal">Pass {index + 1}</p>
                                <span className={cn(
                                  "rounded-full px-2 py-0.5 text-[10px] font-semibold uppercase tracking-[0.05em]",
                                  pkg.status === "active" ? "bg-emerald-100 text-emerald-700" : "bg-charcoal/[0.06] text-charcoal/50"
                                )}>
                                  {pkg.status}
                                </span>
                              </div>
                              <p className="mt-1 text-xs text-charcoal/50">
                                {pkg.remainingCredits}/{pkg.creditCount} credits
                                {pkg.activatedAt && ` · activated ${formatManilaDate(pkg.activatedAt)}`}
                                {pkg.expiresAt && ` · expires ${formatManilaDate(pkg.expiresAt)}`}
                              </p>
                            </div>
                            <AdjustCreditsForm
                              customerPackageId={pkg.id}
                              currentCredits={pkg.remainingCredits}
                              maximumCredits={pkg.creditCount}
                              packageName={`${group.name} · Pass ${index + 1}`}
                            />
                          </div>
                        </div>
                      ))}
                    </div>
                  </details>
                </article>
              );
            })}

            {archivedPackages.length > 0 && (
              <details className="group rounded-2xl border border-charcoal/10 bg-ivory">
                <summary className="flex min-h-14 cursor-pointer list-none items-center justify-between gap-4 px-5 marker:content-none sm:px-6">
                  <span className="flex items-center gap-2 text-sm font-medium text-charcoal/65">
                    <History size={16} aria-hidden /> Package history ({archivedPackages.length})
                  </span>
                  <ChevronDown size={16} className="transition-transform group-open:rotate-180" aria-hidden />
                </summary>
                <div className="divide-y divide-charcoal/[0.07] border-t border-charcoal/[0.07]">
                  {archivedPackages.map((pkg) => (
                    <div key={pkg.id} className="flex flex-col gap-1 px-5 py-3 text-sm sm:flex-row sm:items-center sm:justify-between sm:px-6">
                      <span className="text-charcoal">{pkg.packageName}</span>
                      <span className="text-charcoal/50">
                        <span className="capitalize">{pkg.status}</span>
                        {pkg.expiresAt && ` · ${formatManilaDate(pkg.expiresAt)}`}
                      </span>
                    </div>
                  ))}
                </div>
              </details>
            )}
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
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <p className="text-charcoal">{membership.membershipName}</p>
                  {admin.role === "super_admin" && (
                    <a href={`/admin/memberships#${membership.id}`} className="text-xs underline underline-offset-2">Manage</a>
                  )}
                </div>
                <p className="mt-1 text-sm text-charcoal/60">
                  <span className="capitalize">{membership.status.replaceAll("_", " ")}</span> · {formatManilaDate(membership.startsAt)}–{formatManilaDate(membership.commitmentEndsAt)}
                </p>
                <p className="mt-1 text-sm text-charcoal/60">
                  {centavosToPeso(membership.monthlyFeeCentavos)}/month · Payment: {membership.paymentStatus.replaceAll("_", " ")}
                  {membership.nextPaymentDue ? ` · Next due ${formatManilaDate(membership.nextPaymentDue)}` : ""}
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
                    <td className="px-4 py-3 text-charcoal/70">{formatManilaDate(purchase.createdAt)}</td>
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
