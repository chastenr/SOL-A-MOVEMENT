import "server-only";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { getManilaDayRange } from "@/lib/booking-cutoff";

export type AdminBookingStatus = "pending" | "booked" | "cancelled" | "completed" | "no_show";

export type AdminBookingRow = {
  id: string;
  reference: string;
  status: AdminBookingStatus;
  creditsUsed: number;
  bookedAt: string;
  cancelledAt: string | null;
  customer: {
    id: string;
    name: string;
    email: string;
    phone: string;
    phoneVerified: boolean;
  };
  session: {
    id: string;
    startAt: string;
    endAt: string;
    className: string;
    serviceSlug: string;
    location: string;
    instructor: string | null;
  } | null;
  package: {
    name: string;
    remainingCredits: number;
    creditCount: number;
  } | null;
  payment: {
    reference: string;
    amountCentavos: number;
    method: string;
    status: string;
  } | null;
};

export type AdminBookingFilters = {
  id?: string;
  search?: string;
  status?: AdminBookingStatus;
  range?: "today" | "upcoming" | "past";
  serviceSlug?: string;
  locationId?: string;
  /** Filters by the class SESSION's start time (calendar view), not by when the booking was made. */
  from?: string;
  to?: string;
};

function bookingReference(id: string): string {
  return `BK-${id.replace(/-/g, "").slice(0, 8).toUpperCase()}`;
}

// PostgREST rows for the nested select below — typed loosely (fields we
// select), not a full generated schema (none exists for this project yet).
type RawBookingRow = {
  id: string;
  status: AdminBookingStatus;
  credits_used: number;
  booked_at: string;
  cancelled_at: string | null;
  user_id: string;
  class_session: {
    id: string;
    start_at: string;
    end_at: string;
    class_type: { name: string; service_slug: string } | null;
    location: { name: string } | null;
    instructor: { name: string } | null;
  } | null;
  customer_package: {
    package_name_snapshot: string;
    remaining_credits: number;
    credit_count: number;
    purchase: {
      reference_number: string;
      total_amount_centavos: number;
      credit_count_snapshot: number | null;
      payment_method: string;
      purchase_status: string;
    } | null;
  } | null;
  customer_membership: { membership_name_snapshot: string } | null;
};

type ProfileRow = {
  id: string;
  first_name: string;
  last_name: string;
  email: string;
  mobile_number: string;
  phone_verified_at: string | null;
};

/**
 * Real bookings from `class_bookings` — the single source of truth also
 * used by the calendar and the customer's own /account view. No parallel
 * "admin_bookings" table.
 */
export async function getAdminBookings(filters: AdminBookingFilters = {}): Promise<AdminBookingRow[]> {
  const supabase = await createSupabaseServerClient();

  let query = supabase
    .from("class_bookings")
    .select(
      `id, status, credits_used, booked_at, cancelled_at, user_id,
       class_session:class_sessions (
         id, start_at, end_at,
         class_type:class_types ( name, service_slug ),
         location:locations ( name ),
         instructor:instructors ( name )
       ),
       customer_package:customer_packages (
         package_name_snapshot, remaining_credits, credit_count,
         purchase:purchases ( reference_number, total_amount_centavos, credit_count_snapshot, payment_method, purchase_status )
       ),
       customer_membership:customer_memberships ( membership_name_snapshot )`
    )
    .order("booked_at", { ascending: false })
    .limit(200);

  if (filters.id) query = query.eq("id", filters.id);
  if (filters.status) query = query.eq("status", filters.status);

  const { data, error } = await query;
  if (error || !data) {
    // A failed fetch here renders as "No bookings match these filters yet"
    // to the admin — indistinguishable from a genuinely empty result unless
    // this is logged, so a real outage (RLS misconfig, timeout, network
    // blip) looks identical to a slow-but-normal day.
    if (error) console.error("[getAdminBookings] query failed", { filters, error });
    return [];
  }

  const rows = data as unknown as RawBookingRow[];
  const userIds = [...new Set(rows.map((row) => row.user_id))];

  const { data: profileRows } = userIds.length
    ? await supabase
        .from("profiles")
        .select("id, first_name, last_name, email, mobile_number, phone_verified_at")
        .in("id", userIds)
    : { data: [] as ProfileRow[] };

  const profileById = new Map((profileRows ?? []).map((profile) => [profile.id, profile as ProfileRow]));

  let mapped: AdminBookingRow[] = rows.map((row) => {
    const profile = profileById.get(row.user_id);
    const purchase = row.customer_package?.purchase;
    const perCreditAmount =
      purchase && purchase.credit_count_snapshot
        ? Math.round(purchase.total_amount_centavos / purchase.credit_count_snapshot) * row.credits_used
        : null;

    return {
      id: row.id,
      reference: bookingReference(row.id),
      status: row.status,
      creditsUsed: row.credits_used,
      bookedAt: row.booked_at,
      cancelledAt: row.cancelled_at,
      customer: {
        id: row.user_id,
        name: profile ? `${profile.first_name} ${profile.last_name}`.trim() || "—" : "—",
        email: profile?.email ?? "—",
        phone: profile?.mobile_number ?? "—",
        phoneVerified: Boolean(profile?.phone_verified_at),
      },
      session: row.class_session
        ? {
            id: row.class_session.id,
            startAt: row.class_session.start_at,
            endAt: row.class_session.end_at,
            className: row.class_session.class_type?.name ?? "—",
            serviceSlug: row.class_session.class_type?.service_slug ?? "",
            location: row.class_session.location?.name ?? "—",
            instructor: row.class_session.instructor?.name ?? null,
          }
        : null,
      package: row.customer_package
        ? {
            name: row.customer_package.package_name_snapshot,
            remainingCredits: row.customer_package.remaining_credits,
            creditCount: row.customer_package.credit_count,
          }
        : row.customer_membership
          ? { name: row.customer_membership.membership_name_snapshot, remainingCredits: 0, creditCount: 0 }
          : null,
      payment: purchase
        ? {
            reference: purchase.reference_number,
            amountCentavos: perCreditAmount ?? purchase.total_amount_centavos,
            method: purchase.payment_method,
            status: purchase.purchase_status,
          }
        : null,
    };
  });

  // Calendar view: which sessions land on the visible days, not which
  // bookings were made in that window — booked_at and the session's own
  // start_at are frequently different dates (a booking made today for a
  // class next week), so this has to filter on the session time.
  if (filters.from || filters.to) {
    const fromTime = filters.from ? new Date(filters.from).getTime() : -Infinity;
    const toTime = filters.to ? new Date(filters.to).getTime() : Infinity;
    mapped = mapped.filter((row) => {
      if (!row.session) return false;
      const start = new Date(row.session.startAt).getTime();
      return start >= fromTime && start <= toTime;
    });
  }

  if (filters.serviceSlug) {
    mapped = mapped.filter((row) => row.session?.serviceSlug === filters.serviceSlug);
  }

  if (filters.search) {
    const needle = filters.search.trim().toLowerCase();
    mapped = mapped.filter(
      (row) =>
        row.customer.name.toLowerCase().includes(needle) ||
        row.customer.email.toLowerCase().includes(needle) ||
        row.customer.phone.toLowerCase().includes(needle) ||
        row.reference.toLowerCase().includes(needle)
    );
  }

  if (filters.range) {
    const now = Date.now();
    const { start: startOfToday, end: endOfToday } = getManilaDayRange();

    mapped = mapped.filter((row) => {
      if (!row.session) return false;
      const start = new Date(row.session.startAt).getTime();
      if (filters.range === "today") return start >= startOfToday.getTime() && start < endOfToday.getTime();
      if (filters.range === "upcoming") return start > now;
      if (filters.range === "past") return start <= now;
      return true;
    });
  }

  return mapped;
}

export async function getAdminBookingById(id: string): Promise<AdminBookingRow | null> {
  const bookings = await getAdminBookings({ id });
  return bookings[0] ?? null;
}

export type ClassSessionRosterRow = {
  id: string;
  reference: string;
  status: AdminBookingStatus;
  customerName: string;
  customerEmail: string;
  packageName: string;
};

/**
 * Who's booked into one specific session — this is the "every hour, every
 * day" check-in list: an admin/coach opens the session that just ran (or is
 * running) and marks each row Completed or No Show. Deliberately not routed
 * through getAdminBookings() — that function joins payment/package detail
 * this view doesn't need, and has no session-id filter to begin with (see
 * migration 0004's admin_complete_class_booking/admin_mark_class_booking_no_show,
 * which is what these rows' actions ultimately call).
 */
export async function getClassSessionRoster(sessionId: string): Promise<ClassSessionRosterRow[]> {
  const supabase = await createSupabaseServerClient();
  const { data } = await supabase
    .from("class_bookings")
    .select("id, status, user_id, customer_package:customer_packages(package_name_snapshot), customer_membership:customer_memberships(membership_name_snapshot)")
    .eq("class_session_id", sessionId)
    .order("booked_at", { ascending: true });

  const rows = (data ?? []) as unknown as {
    id: string;
    status: AdminBookingStatus;
    user_id: string;
    customer_package: { package_name_snapshot: string } | null;
    customer_membership: { membership_name_snapshot: string } | null;
  }[];
  if (rows.length === 0) return [];

  // class_bookings.user_id references auth.users, not public.profiles —
  // PostgREST can't auto-embed across that (same limitation as
  // getAdminBookings above), so names/emails are fetched separately.
  const userIds = [...new Set(rows.map((row) => row.user_id))];
  const { data: profiles } = await supabase
    .from("profiles")
    .select("id, first_name, last_name, email")
    .in("id", userIds);
  const profileById = new Map((profiles ?? []).map((profile) => [profile.id, profile]));

  return rows.map((row) => {
    const profile = profileById.get(row.user_id);
    return {
      id: row.id,
      reference: bookingReference(row.id),
      status: row.status,
      customerName: profile ? `${profile.first_name} ${profile.last_name}`.trim() || profile.email : "—",
      customerEmail: profile?.email ?? "—",
      packageName: row.customer_package?.package_name_snapshot ?? row.customer_membership?.membership_name_snapshot ?? "—",
    };
  });
}
