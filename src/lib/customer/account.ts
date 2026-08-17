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

export type CustomerMembershipRow = {
  id: string;
  membershipName: string;
  status: "active" | "expired" | "revoked";
  startsAt: string;
  expiresAt: string;
  unlimitedBooking: boolean;
  isCurrentlyActive: boolean;
};

export async function getCustomerMemberships(userId: string): Promise<CustomerMembershipRow[]> {
  const supabase = await createSupabaseServerClient();
  const { data, error } = await supabase
    .from("customer_memberships")
    .select("id, membership_name_snapshot, status, starts_at, expires_at, unlimited_booking")
    .eq("user_id", userId)
    .order("created_at", { ascending: false });
  if (error) console.error("[getCustomerMemberships] query failed", error);
  const now = Date.now();
  return (data ?? []).map((row) => ({
    id: row.id,
    membershipName: row.membership_name_snapshot,
    status: row.status,
    startsAt: row.starts_at,
    expiresAt: row.expires_at,
    unlimitedBooking: row.unlimited_booking,
    isCurrentlyActive:
      row.status === "active" &&
      row.unlimited_booking &&
      new Date(row.starts_at).getTime() <= now &&
      new Date(row.expires_at).getTime() > now,
  }));
}

export async function getCustomerPackages(userId: string): Promise<CustomerPackageRow[]> {
  const supabase = await createSupabaseServerClient();
  const { data, error } = await supabase
    .from("customer_packages")
    .select("id, package_name_snapshot, credit_count, remaining_credits, status, activated_at, expires_at, package:packages(service_slug)")
    .eq("user_id", userId)
    .order("created_at", { ascending: false });

  if (error) console.error("[getCustomerPackages] customer_packages query failed", error);

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
  customer_membership: { membership_name_snapshot: string } | null;
};

export async function getCustomerBookings(userId: string): Promise<CustomerBookingRow[]> {
  const supabase = await createSupabaseServerClient();
  const { data, error } = await supabase
    .from("class_bookings")
    .select(
      `id, status, booked_at,
       class_session:class_sessions(start_at, end_at, class_type:class_types(name), location:locations(name)),
       customer_package:customer_packages(package_name_snapshot),
       customer_membership:customer_memberships(membership_name_snapshot)`
    )
    .eq("user_id", userId)
    .order("booked_at", { ascending: false });

  if (error) console.error("[getCustomerBookings] class_bookings query failed", error);

  const rows = (data as unknown as RawCustomerBooking[]) ?? [];
  const now = Date.now();
  return rows.map((row) => ({
    id: row.id,
    reference: formatBookingReference(row.id),
    status: row.status,
    bookedAt: row.booked_at,
    isUpcoming: row.status === "booked" && !!row.class_session && new Date(row.class_session.start_at).getTime() > now,
    packageName: row.customer_package?.package_name_snapshot ?? row.customer_membership?.membership_name_snapshot ?? null,
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

export async function getCustomerBookedSessionIds(userId: string): Promise<string[]> {
  const supabase = await createSupabaseServerClient();
  const { data, error } = await supabase
    .from("class_bookings")
    .select("class_session_id")
    .eq("user_id", userId)
    .eq("status", "booked");
  if (error) {
    console.error("[getCustomerBookedSessionIds] query failed", error);
    return [];
  }
  return (data ?? []).map((row) => row.class_session_id);
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
  const { data, error } = await supabase
    .from("purchases")
    .select("id, reference_number, package_name_snapshot, total_amount_centavos, purchase_status, created_at")
    .eq("user_id", userId)
    .order("created_at", { ascending: false });

  if (error) console.error("[getCustomerPurchases] purchases query failed", error);

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
  level: string;
  location: string;
  instructor: string | null;
  instructorPhotoUrl: string | null;
  instructorBio: string | null;
  classDescription: string;
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

  const { data: customerPackage, error: customerPackageError } = await supabase
    .from("customer_packages")
    .select("package_id, user_id")
    .eq("id", customerPackageId)
    .single();
  if (customerPackageError) {
    console.error("[getEligibleSessions] customer package query failed", customerPackageError);
    return [];
  }
  if (!customerPackage || customerPackage.user_id !== userId) return [];

  const { data: pkg, error: packageError } = await supabase
    .from("packages")
    .select("service_slug")
    .eq("id", customerPackage.package_id)
    .single();
  if (packageError) {
    console.error("[getEligibleSessions] package query failed", packageError);
    return [];
  }

  const { data, error: sessionsError } = await supabase
    .from("class_sessions")
    .select(
      "id, start_at, end_at, capacity, booked_count, booking_enabled, class_type:class_types(name, slug, service_slug, level, description), location:locations(name), instructor:instructors(name, photo_url, bio)"
    )
    .eq("status", "scheduled")
    .gt("start_at", new Date().toISOString())
    .order("start_at", { ascending: true })
    .limit(100);

  if (sessionsError) {
    console.error("[getEligibleSessions] class sessions query failed", sessionsError);
    return [];
  }

  type RawSession = {
    id: string;
    start_at: string;
    end_at: string;
    capacity: number;
    booked_count: number;
    booking_enabled: boolean;
    class_type: { name: string; slug: string; service_slug: string; level: string; description: string } | null;
    location: { name: string } | null;
    instructor: { name: string; photo_url: string | null; bio: string | null } | null;
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
      level: row.class_type?.level ?? "",
      location: row.location?.name ?? "—",
      instructor: row.instructor?.name ?? null,
      instructorPhotoUrl: row.instructor?.photo_url ?? null,
      instructorBio: row.instructor?.bio ?? null,
      classDescription: row.class_type?.description ?? "",
      capacity: row.capacity,
      bookedCount: row.booked_count,
      bookingEnabled: row.booking_enabled,
    }));
}

export async function getEligibleSessionsForMembership(
  customerMembershipId: string,
  userId: string
): Promise<EligibleSessionRow[]> {
  const supabase = await createSupabaseServerClient();
  const { data: membership, error: membershipError } = await supabase
    .from("customer_memberships")
    .select("user_id, status, starts_at, expires_at, unlimited_booking")
    .eq("id", customerMembershipId)
    .single();
  if (
    membershipError ||
    !membership ||
    membership.user_id !== userId ||
    membership.status !== "active" ||
    !membership.unlimited_booking ||
    new Date(membership.starts_at).getTime() > Date.now() ||
    new Date(membership.expires_at).getTime() <= Date.now()
  ) return [];

  const { data, error } = await supabase
    .from("class_sessions")
    .select(
      "id, start_at, end_at, capacity, booked_count, booking_enabled, class_type:class_types(name, slug, service_slug, level, description), location:locations(name), instructor:instructors(name, photo_url, bio)"
    )
    .eq("status", "scheduled")
    .gt("start_at", new Date().toISOString())
    .order("start_at", { ascending: true })
    .limit(100);
  if (error) {
    console.error("[getEligibleSessionsForMembership] sessions query failed", error);
    return [];
  }

  type RawSession = {
    id: string;
    start_at: string;
    end_at: string;
    capacity: number;
    booked_count: number;
    booking_enabled: boolean;
    class_type: { name: string; slug: string; service_slug: string; level: string; description: string } | null;
    location: { name: string } | null;
    instructor: { name: string; photo_url: string | null; bio: string | null } | null;
  };

  return (((data as unknown as RawSession[]) ?? [])).map((row) => ({
    id: row.id,
    startAt: row.start_at,
    endAt: row.end_at,
    className: row.class_type?.name ?? "—",
    classSlug: row.class_type?.slug ?? "",
    serviceSlug: row.class_type?.service_slug ?? "",
    level: row.class_type?.level ?? "",
    location: row.location?.name ?? "—",
    instructor: row.instructor?.name ?? null,
    instructorPhotoUrl: row.instructor?.photo_url ?? null,
    instructorBio: row.instructor?.bio ?? null,
    classDescription: row.class_type?.description ?? "",
    capacity: row.capacity,
    bookedCount: row.booked_count,
    bookingEnabled: row.booking_enabled,
  }));
}
