import type { Metadata } from "next";
import Link from "next/link";
import { format } from "date-fns";
import { requireAdmin } from "@/lib/auth/require-role";
import { getAdminBookings, type AdminBookingStatus } from "@/lib/admin/bookings";
import { fieldInputClasses } from "@/components/ui/Field";
import { SubmitButton } from "@/components/ui/SubmitButton";
import { cancelBookingAction, completeBookingAction, noShowBookingAction } from "./actions";

export const metadata: Metadata = {
  title: "Bookings",
  robots: { index: false, follow: false },
};

const STATUS_OPTIONS: { value: AdminBookingStatus | ""; label: string }[] = [
  { value: "", label: "All Statuses" },
  { value: "booked", label: "Confirmed" },
  { value: "completed", label: "Completed" },
  { value: "cancelled", label: "Cancelled" },
  { value: "no_show", label: "No Show" },
];

const RANGE_OPTIONS: { value: "" | "today" | "upcoming" | "past"; label: string }[] = [
  { value: "", label: "All Dates" },
  { value: "today", label: "Today" },
  { value: "upcoming", label: "Upcoming" },
  { value: "past", label: "Past" },
];

const STATUS_LABEL: Record<AdminBookingStatus, string> = {
  booked: "Confirmed",
  completed: "Completed",
  cancelled: "Cancelled",
  no_show: "No Show",
};

const STATUS_BADGE: Record<AdminBookingStatus, string> = {
  booked: "bg-clay/10 text-clay",
  completed: "bg-emerald-100 text-emerald-700",
  cancelled: "bg-charcoal/10 text-charcoal/50",
  no_show: "bg-red-100 text-red-700",
};

type SearchParams = {
  search?: string;
  status?: AdminBookingStatus;
  range?: "today" | "upcoming" | "past";
};

export default async function AdminBookingsPage({
  searchParams,
}: {
  searchParams: Promise<SearchParams>;
}) {
  await requireAdmin();
  const params = await searchParams;

  const bookings = await getAdminBookings({
    search: params.search,
    status: params.status,
    range: params.range,
  });

  return (
    <div>
      <h1 className="font-display text-2xl text-charcoal">Bookings</h1>
      <p className="mt-1 text-sm text-charcoal/55">
        Every confirmed class booking, straight from the database — the same records shown on the calendar.
      </p>

      <form method="GET" className="mt-6 flex flex-wrap gap-3">
        <input
          type="text"
          name="search"
          defaultValue={params.search}
          placeholder="Search name, email, phone or reference"
          className={`${fieldInputClasses} max-w-xs`}
        />
        <select name="status" defaultValue={params.status ?? ""} className={`${fieldInputClasses} w-auto appearance-none`}>
          {STATUS_OPTIONS.map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>
        <select name="range" defaultValue={params.range ?? ""} className={`${fieldInputClasses} w-auto appearance-none`}>
          {RANGE_OPTIONS.map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>
        <button type="submit" className="rounded-full bg-charcoal px-5 py-2.5 text-[0.72rem] font-medium uppercase tracking-[0.2em] text-ivory">
          Filter
        </button>
      </form>

      {bookings.length === 0 ? (
        <p className="mt-8 text-charcoal/60">
          No bookings match these filters yet. Once the database migrations are applied and customers start
          booking real classes, they&rsquo;ll appear here automatically.
        </p>
      ) : (
        <div className="mt-6 overflow-x-auto rounded-xl border border-charcoal/10 bg-ivory">
          <table className="w-full min-w-[1080px] text-left text-sm">
            <thead className="border-b border-charcoal/10 text-xs uppercase tracking-[0.08em] text-charcoal/45">
              <tr>
                <th className="px-4 py-3">Reference</th>
                <th className="px-4 py-3">Customer</th>
                <th className="px-4 py-3">Class</th>
                <th className="px-4 py-3">Location</th>
                <th className="px-4 py-3">Date &amp; Time</th>
                <th className="px-4 py-3">Package</th>
                <th className="px-4 py-3">Status</th>
                <th className="px-4 py-3" />
              </tr>
            </thead>
            <tbody>
              {bookings.map((booking) => (
                <tr key={booking.id} className="border-b border-charcoal/5 last:border-0">
                  <td className="px-4 py-3 font-medium text-charcoal">
                    <Link href={`/admin/bookings/${booking.id}`} className="hover:underline">
                      {booking.reference}
                    </Link>
                  </td>
                  <td className="px-4 py-3">
                    <p className="text-charcoal">{booking.customer.name}</p>
                    <p className="text-xs text-charcoal/45">{booking.customer.email}</p>
                  </td>
                  <td className="px-4 py-3 text-charcoal/70">{booking.session?.className ?? "—"}</td>
                  <td className="px-4 py-3 text-charcoal/70">{booking.session?.location ?? "—"}</td>
                  <td className="px-4 py-3 text-charcoal/70">
                    {booking.session ? format(new Date(booking.session.startAt), "MMM d, yyyy · h:mm a") : "—"}
                  </td>
                  <td className="px-4 py-3 text-charcoal/70">{booking.package?.name ?? "—"}</td>
                  <td className="px-4 py-3">
                    <span className={`rounded-full px-2.5 py-1 text-xs ${STATUS_BADGE[booking.status]}`}>
                      {STATUS_LABEL[booking.status]}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center justify-end gap-3 whitespace-nowrap">
                      {booking.status === "booked" && (
                        <>
                          <form action={completeBookingAction.bind(null, booking.id)}>
                            <SubmitButton pendingLabel="…" className="text-xs underline underline-offset-2 hover:text-charcoal">
                              Complete
                            </SubmitButton>
                          </form>
                          <form action={noShowBookingAction.bind(null, booking.id)}>
                            <SubmitButton
                              pendingLabel="…"
                              className="text-xs text-charcoal/50 underline underline-offset-2 hover:text-red-600"
                            >
                              No Show
                            </SubmitButton>
                          </form>
                          <form action={cancelBookingAction.bind(null, booking.id)}>
                            <SubmitButton pendingLabel="…" className="text-xs text-red-600 underline underline-offset-2 hover:text-red-700">
                              Cancel
                            </SubmitButton>
                          </form>
                        </>
                      )}
                      <Link href={`/admin/bookings/${booking.id}`} className="text-xs underline underline-offset-2 hover:text-charcoal">
                        View
                      </Link>
                    </div>
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
