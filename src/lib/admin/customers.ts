import "server-only";
import { createSupabaseServerClient } from "@/lib/supabase/server";

export type AdminCustomerRow = {
  id: string;
  name: string;
  email: string;
  mobileNumber: string;
  createdAt: string;
  activeCredits: number;
};

export type AdminCustomerFilters = {
  search?: string;
};

/** Every registered customer account (role = 'customer') — staff/admin accounts live at /admin/users instead. */
export async function getAdminCustomers(filters: AdminCustomerFilters = {}): Promise<AdminCustomerRow[]> {
  const supabase = await createSupabaseServerClient();

  let query = supabase
    .from("profiles")
    .select("id, first_name, last_name, email, mobile_number, created_at")
    .eq("role", "customer")
    .order("created_at", { ascending: false })
    .limit(500);

  if (filters.search) {
    // `,` and `%` are syntax in PostgREST's .or() filter grammar (condition
    // separator and ilike wildcard) — an unescaped one in the search term
    // (e.g. a name pasted as "Dela Cruz, Maria") breaks the filter, which
    // fails the query rather than matching too much. Same guard as
    // getAdminUsers() in ./users.ts.
    const term = `%${filters.search.replace(/[%,]/g, "")}%`;
    query = query.or(`email.ilike.${term},first_name.ilike.${term},last_name.ilike.${term}`);
  }

  const { data, error } = await query;
  if (error) console.error("[getAdminCustomers] query failed", { filters, error });
  const rows = data ?? [];

  // Summed in JS rather than a SQL aggregate — one extra query keeps this
  // portable across PostgREST versions instead of depending on its
  // aggregate-function support in `select`.
  const userIds = rows.map((row) => row.id);
  const { data: activePackages } = userIds.length
    ? await supabase.from("customer_packages").select("user_id, remaining_credits").eq("status", "active").in("user_id", userIds)
    : { data: [] as { user_id: string; remaining_credits: number }[] };

  const creditsByUser = new Map<string, number>();
  for (const pkg of activePackages ?? []) {
    creditsByUser.set(pkg.user_id, (creditsByUser.get(pkg.user_id) ?? 0) + pkg.remaining_credits);
  }

  return rows.map((row) => ({
    id: row.id,
    name: `${row.first_name} ${row.last_name}`.trim() || row.email,
    email: row.email,
    mobileNumber: row.mobile_number,
    createdAt: row.created_at,
    activeCredits: creditsByUser.get(row.id) ?? 0,
  }));
}

export type AdminCustomerDetail = {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  mobileNumber: string;
  birthday: string | null;
  createdAt: string;
};

export async function getAdminCustomerDetail(userId: string): Promise<AdminCustomerDetail | null> {
  const supabase = await createSupabaseServerClient();
  const { data } = await supabase
    .from("profiles")
    .select("id, first_name, last_name, email, mobile_number, birthday, created_at")
    .eq("id", userId)
    .eq("role", "customer")
    .single();

  if (!data) return null;
  return {
    id: data.id,
    firstName: data.first_name,
    lastName: data.last_name,
    email: data.email,
    mobileNumber: data.mobile_number,
    birthday: data.birthday,
    createdAt: data.created_at,
  };
}

export type AdminCustomerPackageRow = {
  id: string;
  packageName: string;
  creditCount: number;
  remainingCredits: number;
  status: string;
  activatedAt: string | null;
  expiresAt: string | null;
};

export async function getCustomerPackagesForAdmin(userId: string): Promise<AdminCustomerPackageRow[]> {
  const supabase = await createSupabaseServerClient();
  const { data } = await supabase
    .from("customer_packages")
    .select("id, package_name_snapshot, credit_count, remaining_credits, status, activated_at, expires_at")
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
  }));
}

export type AdminCustomerPurchaseRow = {
  id: string;
  referenceNumber: string;
  packageName: string;
  creditCount: number | null;
  amountCentavos: number;
  method: string;
  status: string;
  createdAt: string;
};

export async function getCustomerPurchasesForAdmin(userId: string): Promise<AdminCustomerPurchaseRow[]> {
  const supabase = await createSupabaseServerClient();
  const { data } = await supabase
    .from("purchases")
    .select(
      "id, reference_number, package_name_snapshot, credit_count_snapshot, total_amount_centavos, payment_method, purchase_status, created_at"
    )
    .eq("user_id", userId)
    .order("created_at", { ascending: false });

  return (data ?? []).map((row) => ({
    id: row.id,
    referenceNumber: row.reference_number,
    packageName: row.package_name_snapshot,
    // Snapshotted at purchase time (see migration 0001) so this stays
    // accurate even if the package's own credit_count changes later —
    // null for studio-rental-style products that don't grant a credit count.
    creditCount: row.credit_count_snapshot,
    amountCentavos: row.total_amount_centavos,
    method: row.payment_method,
    status: row.purchase_status,
    createdAt: row.created_at,
  }));
}

export type AdminPackageOption = { id: string; name: string };

/** Active, purchasable packages — used to populate the "Grant Package" dropdown. */
export async function getGrantablePackages(): Promise<AdminPackageOption[]> {
  const supabase = await createSupabaseServerClient();
  const { data } = await supabase
    .from("packages")
    .select("id, name")
    .eq("is_active", true)
    .order("sort_order");

  return data ?? [];
}
