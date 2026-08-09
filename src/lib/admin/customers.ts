import "server-only";
import { createSupabaseServerClient } from "@/lib/supabase/server";

export type AdminCustomerRow = {
  id: string;
  name: string;
  email: string;
  mobileNumber: string;
  createdAt: string;
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
    const term = filters.search.trim();
    query = query.or(`email.ilike.%${term}%,first_name.ilike.%${term}%,last_name.ilike.%${term}%`);
  }

  const { data } = await query;
  return (data ?? []).map((row) => ({
    id: row.id,
    name: `${row.first_name} ${row.last_name}`.trim() || row.email,
    email: row.email,
    mobileNumber: row.mobile_number,
    createdAt: row.created_at,
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
  amountCentavos: number;
  method: string;
  status: string;
  createdAt: string;
};

export async function getCustomerPurchasesForAdmin(userId: string): Promise<AdminCustomerPurchaseRow[]> {
  const supabase = await createSupabaseServerClient();
  const { data } = await supabase
    .from("purchases")
    .select("id, reference_number, package_name_snapshot, total_amount_centavos, payment_method, purchase_status, created_at")
    .eq("user_id", userId)
    .order("created_at", { ascending: false });

  return (data ?? []).map((row) => ({
    id: row.id,
    referenceNumber: row.reference_number,
    packageName: row.package_name_snapshot,
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
