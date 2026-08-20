import "server-only";
import { createSupabaseServerClient } from "@/lib/supabase/server";

export type AdminNotificationSeverity = "info" | "success" | "warning" | "error";

export type AdminNotification = {
  id: string;
  type: string;
  title: string;
  message: string;
  severity: AdminNotificationSeverity;
  actionUrl: string | null;
  entityType: string | null;
  entityId: string | null;
  createdAt: string;
  isRead: boolean;
};

type NotificationRow = {
  id: string;
  type: string;
  title: string;
  message: string;
  severity: AdminNotificationSeverity;
  action_url: string | null;
  entity_type: string | null;
  entity_id: string | null;
  created_at: string;
};

export async function getAdminNotifications(
  adminId: string,
  limit = 100
): Promise<{ notifications: AdminNotification[]; unreadCount: number }> {
  const supabase = await createSupabaseServerClient();
  const { data, error } = await supabase
    .from("admin_notifications")
    .select("id, type, title, message, severity, action_url, entity_type, entity_id, created_at")
    .order("created_at", { ascending: false })
    .limit(limit);

  if (error || !data) {
    // Allows the admin shell to remain usable during a rolling deployment in
    // which application code reaches Vercel just before the migration lands.
    if (error) console.error("[admin-notifications] notification query failed", error);
    return { notifications: [], unreadCount: 0 };
  }

  const rows = data as NotificationRow[];
  const ids = rows.map((row) => row.id);
  const readIds = new Set<string>();

  if (ids.length > 0) {
    const { data: reads, error: readsError } = await supabase
      .from("admin_notification_reads")
      .select("notification_id")
      .eq("admin_id", adminId)
      .in("notification_id", ids);

    if (readsError) console.error("[admin-notifications] read-state query failed", readsError);
    for (const read of reads ?? []) readIds.add(read.notification_id);
  }

  const notifications = rows.map((row) => ({
    id: row.id,
    type: row.type,
    title: row.title,
    message: row.message,
    severity: row.severity,
    actionUrl: row.action_url,
    entityType: row.entity_type,
    entityId: row.entity_id,
    createdAt: row.created_at,
    isRead: readIds.has(row.id),
  }));

  return {
    notifications,
    unreadCount: notifications.filter((notification) => !notification.isRead).length,
  };
}
