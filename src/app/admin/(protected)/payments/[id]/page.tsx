import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { format } from "date-fns";
import { requireAdmin } from "@/lib/auth/require-role";
import { getAdminPurchaseDetail } from "@/lib/admin/payments";
import { centavosToPeso } from "@/lib/money";
import { PaymentReviewActions } from "@/components/admin/PaymentReviewActions";

export const metadata: Metadata = {
  title: "Payment Detail",
  robots: { index: false, follow: false },
};

export default async function AdminPaymentDetailPage({ params }: { params: Promise<{ id: string }> }) {
  await requireAdmin();
  const { id } = await params;
  const purchase = await getAdminPurchaseDetail(id);
  if (!purchase) notFound();

  const canReview = purchase.status === "proof_submitted";

  return (
    <div className="max-w-2xl">
      <Link href="/admin/payments" className="text-sm text-charcoal/55 underline underline-offset-2 hover:text-charcoal">
        ← Back to Payments
      </Link>

      <h1 className="mt-4 font-display text-2xl text-charcoal">{purchase.referenceNumber}</h1>

      <div className="mt-6 grid gap-6 sm:grid-cols-2">
        <section className="rounded-2xl border border-charcoal/10 bg-ivory p-6">
          <p className="text-xs uppercase tracking-[0.14em] text-charcoal/45">Customer</p>
          <dl className="mt-4 space-y-2 text-sm">
            <Row label="Name" value={purchase.customer.name} />
            <Row label="Email" value={purchase.customer.email} />
            <Row label="Phone" value={purchase.customerPhone} />
          </dl>
        </section>

        <section className="rounded-2xl border border-charcoal/10 bg-ivory p-6">
          <p className="text-xs uppercase tracking-[0.14em] text-charcoal/45">Payment</p>
          <dl className="mt-4 space-y-2 text-sm">
            <Row label="Package" value={purchase.packageName} />
            <Row label="Amount" value={centavosToPeso(purchase.amountCentavos)} />
            <Row label="Method" value={purchase.method} />
            <Row label="Provider" value={purchase.provider} />
            <Row label="Status" value={purchase.status} />
            {purchase.approvedAt && <Row label="Approved" value={format(new Date(purchase.approvedAt), "MMM d, yyyy h:mm a")} />}
            {purchase.rejectedReason && <Row label="Rejected Reason" value={purchase.rejectedReason} />}
          </dl>
        </section>
      </div>

      <section className="mt-6 rounded-2xl border border-charcoal/10 bg-ivory p-6">
        <p className="text-xs uppercase tracking-[0.14em] text-charcoal/45">Receipt</p>
        {!purchase.receiptSignedUrl ? (
          <p className="mt-2 text-sm text-charcoal/55">No receipt uploaded.</p>
        ) : purchase.receiptMimeType === "application/pdf" ? (
          <a
            href={purchase.receiptSignedUrl}
            target="_blank"
            rel="noreferrer noopener"
            className="mt-2 inline-block text-sm underline underline-offset-2 hover:text-charcoal"
          >
            View PDF Receipt (link expires in 5 minutes)
          </a>
        ) : (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={purchase.receiptSignedUrl} alt="Payment receipt" className="mt-3 max-w-sm rounded-lg border border-charcoal/10" />
        )}
      </section>

      {canReview && <PaymentReviewActions purchaseId={purchase.id} />}
    </div>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex justify-between gap-6">
      <dt className="text-charcoal/55">{label}</dt>
      <dd className="text-right text-charcoal">{value}</dd>
    </div>
  );
}
