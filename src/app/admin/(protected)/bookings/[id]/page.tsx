import type { Metadata } from "next";
import { notFound } from "next/navigation";
import Link from "next/link";
import { requireAdmin } from "@/lib/auth/require-role";
import { getAdminBookingById } from "@/lib/admin/bookings";
import { centavosToPeso } from "@/lib/money";
import { SubmitButton } from "@/components/ui/SubmitButton";
import { cancelBookingAction, completeBookingAction, noShowBookingAction } from "../actions";
import { cn } from "@/lib/utils";
import {
  formatManilaDateTime,
  formatManilaFullDate,
  formatManilaTime,
} from "@/lib/manila-time";

export const metadata: Metadata = {
  title: "Booking Detail",
  robots: { index: false, follow: false },
};

// Matches Button's variant="secondary" size="md" exactly — SubmitButton is a
// plain <button> (it needs to read useFormStatus from the surrounding form,
// which the polymorphic Button component doesn't expose), so the pill look
// is replicated here rather than pulled from Button's internals.
const PILL_BUTTON =
  "inline-flex items-center justify-center gap-2 rounded-full font-medium uppercase tracking-[0.2em] transition-colors duration-300 ease-out disabled:opacity-50 disabled:pointer-events-none focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-clay bg-transparent text-charcoal border border-charcoal/30 hover:border-charcoal px-5 py-2.5 text-[0.72rem]";

export default async function AdminBookingDetailPage({ params }: { params: Promise<{ id: string }> }) {
  await requireAdmin();
  const { id } = await params;
  const booking = await getAdminBookingById(id);
  if (!booking) notFound();

  const canAct = booking.status === "booked";

  return (
    <div className="max-w-3xl">
      <Link href="/admin/bookings" className="text-sm text-charcoal/55 underline underline-offset-2 hover:text-charcoal">
        ← Back to Bookings
      </Link>

      <div className="mt-4 flex items-center justify-between gap-4">
        <h1 className="font-display text-2xl text-charcoal">{booking.reference}</h1>
        {canAct && (
          <div className="flex gap-2">
            <form action={completeBookingAction.bind(null, booking.id)}>
              <SubmitButton pendingLabel="Completing…" className={PILL_BUTTON}>
                Mark Completed
              </SubmitButton>
            </form>
            <form action={noShowBookingAction.bind(null, booking.id)}>
              <SubmitButton pendingLabel="Saving…" className={PILL_BUTTON}>
                Mark No Show
              </SubmitButton>
            </form>
            <form action={cancelBookingAction.bind(null, booking.id)}>
              <SubmitButton
                pendingLabel="Cancelling…"
                className={cn(PILL_BUTTON, "border-red-300 text-red-600 hover:border-red-500 hover:bg-red-500 hover:text-ivory")}
              >
                Cancel &amp; Refund Credit
              </SubmitButton>
            </form>
          </div>
        )}
      </div>

      <div className="mt-8 grid gap-6 sm:grid-cols-2">
        <section className="rounded-2xl border border-charcoal/10 bg-ivory p-6">
          <p className="text-xs uppercase tracking-[0.14em] text-charcoal/45">Customer</p>
          <dl className="mt-4 space-y-2 text-sm">
            <Row label="Name" value={booking.customer.name} />
            <Row label="Email" value={booking.customer.email} />
            <Row label="Phone" value={booking.customer.phone} />
            <Row label="Phone Verified" value={booking.customer.phoneVerified ? "Yes" : "No"} />
          </dl>
          {/* /admin/customers/[id] lands in a later batch — no link until it exists. */}
        </section>

        <section className="rounded-2xl border border-charcoal/10 bg-ivory p-6">
          <p className="text-xs uppercase tracking-[0.14em] text-charcoal/45">Booking</p>
          <dl className="mt-4 space-y-2 text-sm">
            <Row label="Class" value={booking.session?.className ?? "—"} />
            <Row label="Instructor" value={booking.session?.instructor ?? "—"} />
            <Row label="Location" value={booking.session?.location ?? "—"} />
            <Row
              label="Date"
              value={booking.session ? formatManilaFullDate(booking.session.startAt) : "—"}
            />
            <Row
              label="Time"
              value={
                booking.session
                  ? `${formatManilaTime(booking.session.startAt)} – ${formatManilaTime(booking.session.endAt)}`
                  : "—"
              }
            />
            <Row label="Credits Used" value={String(booking.creditsUsed)} />
            <Row label="Status" value={booking.status} />
          </dl>
        </section>

        <section className="rounded-2xl border border-charcoal/10 bg-ivory p-6">
          <p className="text-xs uppercase tracking-[0.14em] text-charcoal/45">Package</p>
          <dl className="mt-4 space-y-2 text-sm">
            <Row label="Package" value={booking.package?.name ?? "—"} />
            <Row
              label="Credits Remaining"
              value={booking.package ? `${booking.package.remainingCredits} / ${booking.package.creditCount}` : "—"}
            />
          </dl>
        </section>

        <section className="rounded-2xl border border-charcoal/10 bg-ivory p-6">
          <p className="text-xs uppercase tracking-[0.14em] text-charcoal/45">Payment</p>
          <dl className="mt-4 space-y-2 text-sm">
            <Row label="Purchase Reference" value={booking.payment?.reference ?? "—"} />
            <Row label="Amount" value={booking.payment ? centavosToPeso(booking.payment.amountCentavos) : "—"} />
            <Row label="Method" value={booking.payment?.method ?? "—"} />
            <Row label="Payment Status" value={booking.payment?.status ?? "—"} />
          </dl>
        </section>
      </div>

      <div className="mt-6 text-xs text-charcoal/45">
        <p>Booked: {formatManilaDateTime(booking.bookedAt)}</p>
        {booking.cancelledAt && <p>Cancelled: {formatManilaDateTime(booking.cancelledAt)}</p>}
      </div>
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
