"use server";

import { revalidatePath } from "next/cache";
import { requireAdmin } from "@/lib/auth/require-role";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { isUuid } from "@/lib/utils";

type ActionResult = { success: true } | { error: string };

export async function markAdminNotificationReadAction(notificationId: string): Promise<ActionResult> {
  const admin = await requireAdmin();
  if (!isUuid(notificationId)) return { error: "Invalid notification." };

  const supabase = await createSupabaseServerClient();
  const { error } = await supabase
    .from("admin_notification_reads")
    .insert({ notification_id: notificationId, admin_id: admin.id });

  if (error && error.code !== "23505") return { error: "Could not mark that notification as read." };
  revalidatePath("/admin", "layout");
  return { success: true };
}

export async function markAllAdminNotificationsReadAction(): Promise<ActionResult> {
  const admin = await requireAdmin();
  const supabase = await createSupabaseServerClient();
  const { data, error: notificationError } = await supabase
    .from("admin_notifications")
    .select("id")
    .order("created_at", { ascending: false })
    .limit(200);

  if (notificationError) return { error: "Could not load notifications." };
  if (!data || data.length === 0) return { success: true };

  const notificationIds = data.map((notification) => notification.id);
  const { data: existingReads, error: readsError } = await supabase
    .from("admin_notification_reads")
    .select("notification_id")
    .eq("admin_id", admin.id)
    .in("notification_id", notificationIds);

  if (readsError) return { error: "Could not load notification status." };
  const existingIds = new Set((existingReads ?? []).map((read) => read.notification_id));
  const unreadIds = notificationIds.filter((id) => !existingIds.has(id));
  if (unreadIds.length === 0) return { success: true };

  const { error } = await supabase
    .from("admin_notification_reads")
    .insert(unreadIds.map((notificationId) => ({ notification_id: notificationId, admin_id: admin.id })));

  if (error) return { error: "Could not mark notifications as read." };
  revalidatePath("/admin", "layout");
  return { success: true };
}

export async function markAdminNotificationReadFormAction(notificationId: string): Promise<void> {
  await markAdminNotificationReadAction(notificationId);
}

export async function markAllAdminNotificationsReadFormAction(): Promise<void> {
  await markAllAdminNotificationsReadAction();
}
