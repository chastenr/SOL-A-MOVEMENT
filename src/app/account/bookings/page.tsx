import type { Metadata } from "next";
import { format } from "date-fns";
import { requireUser } from "@/lib/auth/require-role";
import { getCustomerBookings } from "@/lib/customer/account";
import { SectionHeading } from "@/components/ui/SectionHeading";
import { Button } from "@/components/ui/Button";
import { CancelBookingButton } from "@/components/account/CancelBookingButton";

export const metadata: Metadata = {
  title: "My Bookings",
  robots: { index: false, follow: false },
};

const STATUS_LABEL: Record<string, string> = {
  booked: "Confirmed",
  completed: "Completed",
  cancelled: "Cancelled",
  no_show: "No Show",
};

export default async function AccountBookingsPage() {
  const user = await requireUser();
  const bookings = await getCustomerBookings(user.id);

  return (
    <div>
      <SectionHeading eyebrow="My Bookings" heading="Your classes." />

      {bookings.length === 0 ? (
        <div className="mt-8 rounded-2xl border border-charcoal/10 bg-ivory p-8 text-center">
          <p className="text-charcoal/60">No upcoming classes.</p>
          <Button href="/account/book" className="mt-4">
            Book a Class
          </Button>
        </div>
      ) : (
        <div className="mt-8 divide-y divide-charcoal/10 rounded-2xl border border-charcoal/10 bg-ivory">
          {bookings.map((booking) => {
            const isUpcoming = booking.isUpcoming;
            return (
              <div key={booking.id} className="flex items-center justify-between gap-4 px-5 py-4">
                <div>
                  <p className="text-charcoal">{booking.session?.className ?? "—"}</p>
                  <p className="text-sm text-charcoal/55">
                    {booking.session ? format(new Date(booking.session.startAt), "EEEE, MMMM d 'at' h:mm a") : "—"}
                    {booking.session ? ` · ${booking.session.location}` : ""}
                  </p>
                  {isUpcoming && booking.session && (
                    <p className="mt-1 text-xs text-charcoal/40">
                      Arrive by {format(new Date(booking.session.arrivalTime), "h:mm a")}
                    </p>
                  )}
                  <p className="mt-1 text-xs text-charcoal/40">
                    {booking.reference}
                    {booking.packageName ? ` · ${booking.packageName}` : ""}
                  </p>
                </div>
                <div className="flex items-center gap-3">
                  <span className="text-xs uppercase tracking-[0.08em] text-charcoal/45">
                    {STATUS_LABEL[booking.status] ?? booking.status}
                  </span>
                  {isUpcoming && <CancelBookingButton bookingId={booking.id} />}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
