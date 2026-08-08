import type { Metadata } from "next";
import { notFound } from "next/navigation";
import Link from "next/link";
import { format } from "date-fns";
import { requireAdmin } from "@/lib/auth/require-role";
import { getAdminBookingById } from "@/lib/admin/bookings";
import { centavosToPeso } from "@/lib/money";
import { Button } from "@/components/ui/Button";
import { cancelBookingAction, completeBookingAction, noShowBookingAction } from "../actions";

export const metadata: Metadata = {
  title: "Booking Detail",
  robots: { index: false, follow: false },
};

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
              <Button type="submit" variant="secondary" size="md">
                Mark Completed
              </Button>
            </form>
            <form action={noShowBookingAction.bind(null, booking.id)}>
              <Button type="submit" variant="secondary" size="md">
                Mark No Show
              </Button>
            </form>
            <form action={cancelBookingAction.bind(null, booking.id)}>
              <Button type="submit" variant="secondary" size="md" className="border-red-300 text-red-600 hover:border-red-500 hover:bg-red-500 hover:text-ivory">
                Cancel &amp; Refund Credit
              </Button>
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
              value={booking.session ? format(new Date(booking.session.startAt), "EEEE, MMMM d, yyyy") : "—"}
            />
            <Row
              label="Time"
              value={
                booking.session
                  ? `${format(new Date(booking.session.startAt), "h:mm a")} – ${format(new Date(booking.session.endAt), "h:mm a")}`
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
        <p>Booked: {format(new Date(booking.bookedAt), "MMM d, yyyy 'at' h:mm a")}</p>
        {booking.cancelledAt && <p>Cancelled: {format(new Date(booking.cancelledAt), "MMM d, yyyy 'at' h:mm a")}</p>}
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
