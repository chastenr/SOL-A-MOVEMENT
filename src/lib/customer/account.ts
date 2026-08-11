import "server-only";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { getArrivalTime } from "@/lib/studio-hours";
import { formatBookingReference } from "@/lib/utils";

export type CustomerPackageRow = {
  id: string;
  packageName: string;
  creditCount: number;
  remainingCredits: number;
  status: "active" | "exhausted" | "expired" | "revoked";
  activatedAt: string | null;
  expiresAt: string | null;
  serviceSlug: string | null;
};

export async function getCustomerPackages(userId: string): Promise<CustomerPackageRow[]> {
  const supabase = await createSupabaseServerClient();
  const { data } = await supabase
    .from("customer_packages")
    .select("id, package_name_snapshot, credit_count, remaining_credits, status, activated_at, expires_at, package:packages(service_slug)")
    .eq("user_id", userId)
    .order("created_at", { ascending: false });

  return (data ?? []).map((row) => ({
    id: row.id,
    packageName: row.package_name_snapshot,
    creditCount: row.credit_count,
    remainingCredits: row.remaining_credits,
    status: row.status,
    activatedAt: row.activated_at,
    expiresAt: row.expires_at,
    serviceSlug: (row.package as unknown as { service_slug: string | null } | null)?.service_slug ?? null,
  }));
}

export type CustomerBookingRow = {
  id: string;
  reference: string;
  status: "booked" | "cancelled" | "completed" | "no_show";
  bookedAt: string;
  isUpcoming: boolean;
  packageName: string | null;
  session: {
    startAt: string;
    endAt: string;
    arrivalTime: string;
    className: string;
    location: string;
  } | null;
};

type RawCustomerBooking = {
  id: string;
  status: CustomerBookingRow["status"];
  booked_at: string;
  class_session: {
    start_at: string;
    end_at: string;
    class_type: { name: string } | null;
    location: { name: string } | null;
  } | null;
  customer_package: { package_name_snapshot: string } | null;
};

export async function getCustomerBookings(userId: string): Promise<CustomerBookingRow[]> {
  const supabase = await createSupabaseServerClient();
  const { data } = await supabase
    .from("class_bookings")
    .select(
      `id, status, booked_at,
       class_session:class_sessions(start_at, end_at, class_type:class_types(name), location:locations(name)),
       customer_package:customer_packages(package_name_snapshot)`
    )
    .eq("user_id", userId)
    .order("booked_at", { ascending: false });

  const rows = (data as unknown as RawCustomerBooking[]) ?? [];
  const now = Date.now();
  return rows.map((row) => ({
    id: row.id,
    reference: formatBookingReference(row.id),
    status: row.status,
    bookedAt: row.booked_at,
    isUpcoming: row.status === "booked" && !!row.class_session && new Date(row.class_session.start_at).getTime() > now,
    packageName: row.customer_package?.package_name_snapshot ?? null,
    session: row.class_session
      ? {
          startAt: row.class_session.start_at,
          endAt: row.class_session.end_at,
          arrivalTime: getArrivalTime(new Date(row.class_session.start_at)).toISOString(),
          className: row.class_session.class_type?.name ?? "—",
          location: row.class_session.location?.name ?? "—",
        }
      : null,
  }));
}

export type CustomerPurchaseRow = {
  id: string;
  referenceNumber: string;
  packageName: string;
  amountCentavos: number;
  status: string;
  createdAt: string;
};

export async function getCustomerPurchases(userId: string): Promise<CustomerPurchaseRow[]> {
  const supabase = await createSupabaseServerClient();
  const { data } = await supabase
    .from("purchases")
    .select("id, reference_number, package_name_snapshot, total_amount_centavos, purchase_status, created_at")
    .eq("user_id", userId)
    .order("created_at", { ascending: false });

  return (data ?? []).map((row) => ({
    id: row.id,
    referenceNumber: row.reference_number,
    packageName: row.package_name_snapshot,
    amountCentavos: row.total_amount_centavos,
    status: row.purchase_status,
    createdAt: row.created_at,
  }));
}

export type EligibleSessionRow = {
  id: string;
  startAt: string;
  endAt: string;
  className: string;
  classSlug: string;
  serviceSlug: string;
  location: string;
  instructor: string | null;
  instructorPhotoUrl: string | null;
  capacity: number;
  bookedCount: number;
  bookingEnabled: boolean;
};

const CLASSIC_SERVICE_SLUGS = ["mat-pilates", "yoga", "barre", "strength-hiit"];

/**
 * Sessions a given customer_package can be redeemed against — "Classics"
 * packages (service_slug null) span mat-pilates/yoga/barre/strength-hiit;
 * Restore/Ballet packages are scoped to that one service only.
 */
export async function getEligibleSessions(customerPackageId: string, userId: string): Promise<EligibleSessionRow[]> {
  const supabase = await createSupabaseServerClient();

  const { data: customerPackage } = await supabase
    .from("customer_packages")
    .select("package_id, user_id")
    .eq("id", customerPackageId)
    .single();
  if (!customerPackage || customerPackage.user_id !== userId) return [];

  const { data: pkg } = await supabase.from("packages").select("service_slug").eq("id", customerPackage.package_id).single();

  const { data } = await supabase
    .from("class_sessions")
    .select(
      "id, start_at, end_at, capacity, booked_count, booking_enabled, class_type:class_types(name, slug, service_slug), location:locations(name), instructor:instructors(name, photo_url)"
    )
    .eq("status", "scheduled")
    .gt("start_at", new Date().toISOString())
    .order("start_at", { ascending: true })
    .limit(100);

  type RawSession = {
    id: string;
    start_at: string;
    end_at: string;
    capacity: number;
    booked_count: number;
    booking_enabled: boolean;
    class_type: { name: string; slug: string; service_slug: string } | null;
    location: { name: string } | null;
    instructor: { name: string; photo_url: string | null } | null;
  };

  const rows = (data as unknown as RawSession[]) ?? [];
  const eligibleSlugs = pkg?.service_slug ? [pkg.service_slug] : CLASSIC_SERVICE_SLUGS;

  // Full sessions stay in the list (badged FULL, booking disabled) rather
  // than disappearing — so a customer can see the class exists and when it
  // next runs, per the studio's preferred "visible but disabled" behavior.
  return rows
    .filter((row) => row.class_type && eligibleSlugs.includes(row.class_type.service_slug))
    .map((row) => ({
      id: row.id,
      startAt: row.start_at,
      endAt: row.end_at,
      className: row.class_type?.name ?? "—",
      classSlug: row.class_type?.slug ?? "",
      serviceSlug: row.class_type?.service_slug ?? "",
      location: row.location?.name ?? "—",
      instructor: row.instructor?.name ?? null,
      instructorPhotoUrl: row.instructor?.photo_url ?? null,
      capacity: row.capacity,
      bookedCount: row.booked_count,
      bookingEnabled: row.booking_enabled,
    }));
}
