import type { Metadata } from "next";
import Link from "next/link";
import { requireUser } from "@/lib/auth/require-role";
import { getCustomerPurchases } from "@/lib/customer/account";
import { centavosToPeso } from "@/lib/money";
import { SectionHeading } from "@/components/ui/SectionHeading";
import { formatManilaDate } from "@/lib/manila-time";

export const metadata: Metadata = {
  title: "Payment History",
  robots: { index: false, follow: false },
};

const STATUS_LABEL: Record<string, string> = {
  pending_payment: "Pending",
  proof_submitted: "Proof Submitted",
  approved: "Paid",
  rejected: "Rejected",
  cancelled: "Cancelled",
  expired: "Expired",
};

export default async function AccountPaymentsPage() {
  const user = await requireUser();
  const purchases = await getCustomerPurchases(user.id);

  return (
    <div>
      <SectionHeading eyebrow="Payment History" heading="Your orders." />

      {purchases.length === 0 ? (
        <p className="mt-8 text-charcoal/60">No orders yet.</p>
      ) : (
        <div className="mt-8 divide-y divide-charcoal/10 rounded-2xl border border-charcoal/10 bg-ivory">
          {purchases.map((purchase) => (
            <Link
              key={purchase.id}
              href={`/purchases/${purchase.id}`}
              className="flex items-center justify-between gap-4 px-5 py-4 hover:bg-cream/40"
            >
              <div>
                <p className="text-charcoal">{purchase.packageName}</p>
                <p className="text-xs text-charcoal/45">
                  {purchase.referenceNumber} · {formatManilaDate(purchase.createdAt)}
                </p>
              </div>
              <div className="text-right">
                <p className="text-charcoal">{centavosToPeso(purchase.amountCentavos)}</p>
                <p className="text-xs text-charcoal/45">{STATUS_LABEL[purchase.status] ?? purchase.status}</p>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
