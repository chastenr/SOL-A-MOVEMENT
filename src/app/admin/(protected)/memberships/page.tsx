import type { Metadata } from "next";
import Link from "next/link";
import { AlertTriangle, CheckCircle2 } from "lucide-react";
import { requireSuperAdmin } from "@/lib/auth/require-role";
import { getAdminMemberships } from "@/lib/admin/memberships";
import { centavosToPeso } from "@/lib/money";
import { formatManilaDate, formatManilaDateTime } from "@/lib/manila-time";
import { SubmitButton } from "@/components/ui/SubmitButton";
import { markMembershipPaymentIssueAction, recordMembershipPaymentAction, setMembershipStatusAction } from "./actions";

export const metadata: Metadata = { title: "Memberships", robots: { index: false, follow: false } };

export default async function AdminMembershipsPage() {
  await requireSuperAdmin();
  const memberships = await getAdminMemberships();
  const attentionCount = memberships.filter((membership) => membership.actionNeeded).length;

  return (
    <div>
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="font-display text-2xl text-charcoal">Memberships</h1>
          <p className="mt-1 text-sm text-charcoal/55">Monthly dues, payment history and booking eligibility.</p>
        </div>
        <p className="rounded-full bg-amber-100 px-3 py-1 text-xs font-medium text-amber-800">
          {attentionCount} requiring attention
        </p>
      </div>

      {memberships.length === 0 ? (
        <p className="mt-8 text-charcoal/60">No membership history yet.</p>
      ) : (
        <div className="mt-6 space-y-4">
          {memberships.map((membership) => (
            <article id={membership.id} key={membership.id} className="scroll-mt-6 rounded-2xl border border-charcoal/10 bg-ivory p-5 sm:p-6">
              <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                <div>
                  <div className="flex flex-wrap items-center gap-2">
                    <h2 className="font-display text-xl text-charcoal">{membership.membershipName}</h2>
                    {membership.actionNeeded ? (
                      <span className="inline-flex items-center gap-1 rounded-full bg-red-100 px-2.5 py-1 text-xs text-red-700">
                        <AlertTriangle size={13} aria-hidden /> {membership.actionNeeded}
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1 rounded-full bg-emerald-100 px-2.5 py-1 text-xs text-emerald-700">
                        <CheckCircle2 size={13} aria-hidden /> Current
                      </span>
                    )}
                  </div>
                  <Link href={`/admin/customers/${membership.customer.id}`} className="mt-1 block text-sm text-charcoal underline underline-offset-2">
                    {membership.customer.name}
                  </Link>
                  <p className="text-xs text-charcoal/45">{membership.customer.email}</p>
                </div>
                <dl className="grid grid-cols-2 gap-x-6 gap-y-2 text-sm sm:grid-cols-4">
                  <div><dt className="text-charcoal/45">Monthly fee</dt><dd>{centavosToPeso(membership.monthlyFeeCentavos)}</dd></div>
                  <div><dt className="text-charcoal/45">Status</dt><dd className="capitalize">{membership.status.replaceAll("_", " ")}</dd></div>
                  <div><dt className="text-charcoal/45">Last payment</dt><dd>{membership.lastPaymentAt ? formatManilaDate(membership.lastPaymentAt) : "—"}</dd></div>
                  <div><dt className="text-charcoal/45">Next payment</dt><dd>{membership.nextPaymentDue ? formatManilaDate(membership.nextPaymentDue) : "—"}</dd></div>
                  <div><dt className="text-charcoal/45">Started</dt><dd>{formatManilaDate(membership.startsAt)}</dd></div>
                  <div><dt className="text-charcoal/45">Commitment ends</dt><dd>{formatManilaDate(membership.commitmentEndsAt)}</dd></div>
                  <div><dt className="text-charcoal/45">Payment</dt><dd className="capitalize">{membership.paymentStatus.replaceAll("_", " ")}</dd></div>
                </dl>
              </div>

              <div className="mt-5 grid gap-3 border-t border-charcoal/10 pt-5 lg:grid-cols-[1fr_auto]">
                <form action={recordMembershipPaymentAction.bind(null, membership.id)} className="grid gap-2 sm:grid-cols-2 lg:grid-cols-[11rem_1fr_auto]">
                  <input name="reference" maxLength={500} placeholder="Payment reference" className="min-h-10 rounded-xl border border-charcoal/15 bg-white px-3 text-sm" />
                  <input name="notes" maxLength={500} placeholder="Admin notes (optional)" className="min-h-10 rounded-xl border border-charcoal/15 bg-white px-3 text-sm" />
                  <SubmitButton pendingLabel="Recording…" className="rounded-full bg-charcoal px-4 py-2 text-xs font-medium text-ivory">Mark payment received</SubmitButton>
                </form>
                <div className="flex flex-wrap gap-2">
                  {membership.status === "active" && (
                    <form action={markMembershipPaymentIssueAction.bind(null, membership.id, "past_due")}><SubmitButton pendingLabel="…" className="rounded-full border border-amber-300 px-3 py-2 text-xs text-amber-800">Mark past due</SubmitButton></form>
                  )}
                  {membership.status !== "cancelled" && membership.paymentStatus !== "failed" && (
                    <form action={markMembershipPaymentIssueAction.bind(null, membership.id, "failed")}><SubmitButton pendingLabel="…" className="rounded-full border border-red-300 px-3 py-2 text-xs text-red-700">Payment failed</SubmitButton></form>
                  )}
                  {membership.status !== "active" && membership.status !== "cancelled" && (
                    <form action={setMembershipStatusAction.bind(null, membership.id, "active")}><SubmitButton pendingLabel="…" className="rounded-full border border-emerald-300 px-3 py-2 text-xs text-emerald-700">Reactivate</SubmitButton></form>
                  )}
                  {membership.status === "active" && (
                    <form action={setMembershipStatusAction.bind(null, membership.id, "suspended")}><SubmitButton pendingLabel="…" className="rounded-full border border-amber-300 px-3 py-2 text-xs text-amber-800">Suspend</SubmitButton></form>
                  )}
                  {membership.status !== "cancelled" && (
                    <form action={setMembershipStatusAction.bind(null, membership.id, "cancelled")}><SubmitButton pendingLabel="…" className="rounded-full border border-red-300 px-3 py-2 text-xs text-red-700">Cancel</SubmitButton></form>
                  )}
                </div>
              </div>

              <details className="mt-4 rounded-xl bg-cream/40 p-4">
                <summary className="cursor-pointer text-sm font-medium text-charcoal">Payment history ({membership.payments.length})</summary>
                <div className="mt-3 overflow-x-auto">
                  <table className="w-full min-w-[620px] text-left text-xs">
                    <thead className="text-charcoal/45"><tr><th className="py-2">Due</th><th>Amount</th><th>Status</th><th>Reference / proof</th><th>Reviewed</th><th>Notes</th></tr></thead>
                    <tbody>{membership.payments.map((payment) => <tr key={payment.id} className="border-t border-charcoal/10"><td className="py-2">{formatManilaDate(payment.dueDate)}</td><td>{centavosToPeso(payment.amountCentavos)}</td><td className="capitalize">{payment.status.replaceAll("_", " ")}</td><td>{payment.paymentReference ?? "—"}{payment.purchaseId && <Link href={`/admin/payments/${payment.purchaseId}`} className="ml-2 underline underline-offset-2">View proof</Link>}</td><td>{payment.reviewedAt ? formatManilaDateTime(payment.reviewedAt) : "—"}</td><td>{payment.adminNotes ?? "—"}</td></tr>)}</tbody>
                  </table>
                </div>
              </details>
            </article>
          ))}
        </div>
      )}
    </div>
  );
}
