import "server-only";
import { createSupabaseServerClient } from "@/lib/supabase/server";

export type AdminUserRole = "customer" | "admin" | "super_admin";

export type AdminUserRow = {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  role: AdminUserRole;
  createdAt: string;
};

export type AdminUserFilters = {
  search?: string;
  role?: AdminUserRole;
};

export async function getAdminUsers(filters: AdminUserFilters = {}): Promise<AdminUserRow[]> {
  const supabase = await createSupabaseServerClient();

  let query = supabase
    .from("profiles")
    .select("id, first_name, last_name, email, role, created_at")
    .order("created_at", { ascending: false })
    .limit(200);

  if (filters.role) query = query.eq("role", filters.role);
  if (filters.search) {
    const term = `%${filters.search.replace(/[%,]/g, "")}%`;
    query = query.or(`email.ilike.${term},first_name.ilike.${term},last_name.ilike.${term}`);
  }

  const { data } = await query;

  return (data ?? []).map((row) => ({
    id: row.id,
    firstName: row.first_name,
    lastName: row.last_name,
    email: row.email,
    role: row.role,
    createdAt: row.created_at,
  }));
}
