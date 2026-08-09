import "server-only";
import { createSupabaseServerClient } from "@/lib/supabase/server";

export type AuditLogRow = {
  id: string;
  actorEmail: string | null;
  actorRole: string | null;
  action: string;
  entityType: string;
  entityId: string | null;
  metadata: Record<string, unknown>;
  createdAt: string;
};

export type AuditLogFilters = {
  action?: string;
  search?: string;
};

/**
 * `audit_logs.actor_id` references `auth.users`, not `public.profiles` —
 * PostgREST can't auto-embed across that (same limitation as
 * class_bookings.user_id elsewhere in this codebase), so actor emails are
 * looked up separately and merged in JS rather than via a nested select.
 */
export async function getAuditLogs(filters: AuditLogFilters = {}): Promise<AuditLogRow[]> {
  const supabase = await createSupabaseServerClient();

  let query = supabase
    .from("audit_logs")
    .select("id, actor_id, actor_role, action, entity_type, entity_id, metadata, created_at")
    .order("created_at", { ascending: false })
    .limit(200);

  if (filters.action) query = query.eq("action", filters.action);

  const { data } = await query;
  const rows = data ?? [];

  const actorIds = [...new Set(rows.map((row) => row.actor_id).filter((id): id is string => !!id))];
  const actorEmailById = new Map<string, string>();
  if (actorIds.length > 0) {
    const { data: profiles } = await supabase.from("profiles").select("id, email").in("id", actorIds);
    for (const profile of profiles ?? []) actorEmailById.set(profile.id, profile.email);
  }

  const mapped = rows.map((row) => ({
    id: row.id,
    actorEmail: row.actor_id ? (actorEmailById.get(row.actor_id) ?? "Unknown") : "System",
    actorRole: row.actor_role,
    action: row.action,
    entityType: row.entity_type,
    entityId: row.entity_id,
    metadata: (row.metadata ?? {}) as Record<string, unknown>,
    createdAt: row.created_at,
  }));

  if (!filters.search) return mapped;
  const term = filters.search.toLowerCase();
  return mapped.filter(
    (row) =>
      row.actorEmail?.toLowerCase().includes(term) ||
      row.action.toLowerCase().includes(term) ||
      row.entityType.toLowerCase().includes(term)
  );
}

/** Distinct action values seen so far, for the filter dropdown. */
export async function getAuditLogActions(): Promise<string[]> {
  const supabase = await createSupabaseServerClient();
  const { data } = await supabase.from("audit_logs").select("action").limit(1000);
  return [...new Set((data ?? []).map((row) => row.action))].sort();
}
