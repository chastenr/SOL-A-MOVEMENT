import type { Metadata } from "next";
import Link from "next/link";
import { format } from "date-fns";
import { requireAdmin } from "@/lib/auth/require-role";
import { getAdminPurchases, type AdminPurchaseStatus } from "@/lib/admin/payments";
import { centavosToPeso } from "@/lib/money";
import { cn } from "@/lib/utils";

export const metadata: Metadata = {
  title: "Payments",
  robots: { index: false, follow: false },
};

// "Failed"/"Refunded" aren't states this system can produce yet — manual
// bank transfer has no failure signal, and there's no refund flow built —
// so the tabs only cover statuses that actually occur.
const TABS: { value: AdminPurchaseStatus | ""; label: string }[] = [
  { value: "", label: "All" },
  { value: "pending_payment", label: "Pending" },
  { value: "proof_submitted", label: "Proof Submitted" },
  { value: "approved", label: "Paid" },
  { value: "rejected", label: "Rejected" },
];

const STATUS_LABEL: Record<AdminPurchaseStatus, string> = {
  pending_payment: "Pending",
  proof_submitted: "Proof Submitted",
  approved: "Paid",
  rejected: "Rejected",
  cancelled: "Cancelled",
  expired: "Expired",
};

const STATUS_BADGE: Record<AdminPurchaseStatus, string> = {
  pending_payment: "bg-charcoal/10 text-charcoal/60",
  proof_submitted: "bg-clay/10 text-clay",
  approved: "bg-emerald-100 text-emerald-700",
  rejected: "bg-red-100 text-red-700",
  cancelled: "bg-charcoal/10 text-charcoal/40",
  expired: "bg-charcoal/10 text-charcoal/40",
};

export default async function AdminPaymentsPage({
  searchParams,
}: {
  searchParams: Promise<{ status?: AdminPurchaseStatus }>;
}) {
  await requireAdmin();
  const { status } = await searchParams;

  const purchases = await getAdminPurchases(status);

  return (
    <div>
      <h1 className="font-display text-2xl text-charcoal">Payments</h1>

      <div className="mt-6 flex flex-wrap gap-2">
        {TABS.map((tab) => (
          <Link
            key={tab.value}
            href={tab.value ? `/admin/payments?status=${tab.value}` : "/admin/payments"}
            className={cn(
              "rounded-full px-4 py-1.5 text-sm transition-colors",
              (status ?? "") === tab.value ? "bg-charcoal text-ivory" : "border border-charcoal/15 hover:bg-charcoal/5"
            )}
          >
            {tab.label}
          </Link>
        ))}
      </div>

      {purchases.length === 0 ? (
        <p className="mt-8 text-charcoal/60">No payments in this view yet.</p>
      ) : (
        <div className="mt-6 overflow-x-auto rounded-xl border border-charcoal/10 bg-ivory">
          <table className="w-full min-w-[880px] text-left text-sm">
            <thead className="border-b border-charcoal/10 text-xs uppercase tracking-[0.08em] text-charcoal/45">
              <tr>
                <th className="px-4 py-3">Reference</th>
                <th className="px-4 py-3">Customer</th>
                <th className="px-4 py-3">Package</th>
                <th className="px-4 py-3">Amount</th>
                <th className="px-4 py-3">Method</th>
                <th className="px-4 py-3">Receipt</th>
                <th className="px-4 py-3">Status</th>
                <th className="px-4 py-3">Submitted</th>
                <th className="px-4 py-3" />
              </tr>
            </thead>
            <tbody>
              {purchases.map((purchase) => (
                <tr key={purchase.id} className="border-b border-charcoal/5 last:border-0">
                  <td className="px-4 py-3 font-medium text-charcoal">
                    <Link href={`/admin/payments/${purchase.id}`} className="hover:underline">
                      {purchase.referenceNumber}
                    </Link>
                  </td>
                  <td className="px-4 py-3">
                    <p className="text-charcoal">{purchase.customer.name}</p>
                    <p className="text-xs text-charcoal/45">{purchase.customer.email}</p>
                  </td>
                  <td className="px-4 py-3 text-charcoal/70">{purchase.packageName}</td>
                  <td className="px-4 py-3 text-charcoal/70">{centavosToPeso(purchase.amountCentavos)}</td>
                  <td className="px-4 py-3 text-charcoal/70">{purchase.method}</td>
                  <td className="px-4 py-3 text-charcoal/70">{purchase.hasReceipt ? "Yes" : "—"}</td>
                  <td className="px-4 py-3">
                    <span className={`rounded-full px-2.5 py-1 text-xs ${STATUS_BADGE[purchase.status]}`}>
                      {STATUS_LABEL[purchase.status]}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-charcoal/60">{format(new Date(purchase.createdAt), "MMM d, h:mm a")}</td>
                  <td className="px-4 py-3 text-right">
                    <Link href={`/admin/payments/${purchase.id}`} className="text-xs underline underline-offset-2 hover:text-charcoal">
                      Review
                    </Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
