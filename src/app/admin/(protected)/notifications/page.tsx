import type { Metadata } from "next";
import Link from "next/link";
import { requireAdmin } from "@/lib/auth/require-role";
import { getAdminNotifications, type AdminNotificationSeverity } from "@/lib/admin/notifications";
import {
  markAdminNotificationReadFormAction,
  markAllAdminNotificationsReadFormAction,
} from "./actions";
import { SubmitButton } from "@/components/ui/SubmitButton";
import { formatManilaDateTime } from "@/lib/manila-time";
import { cn } from "@/lib/utils";

export const metadata: Metadata = {
  title: "Admin Notifications",
  robots: { index: false, follow: false },
};

const SEVERITY_STYLES: Record<AdminNotificationSeverity, string> = {
  info: "bg-sky-100 text-sky-700",
  success: "bg-emerald-100 text-emerald-700",
  warning: "bg-amber-100 text-amber-800",
  error: "bg-red-100 text-red-700",
};

export default async function AdminNotificationsPage() {
  const admin = await requireAdmin();
  const { notifications, unreadCount } = await getAdminNotifications(admin.id, 200);

  return (
    <div>
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="font-display text-2xl text-charcoal">Notifications</h1>
          <p className="mt-1 text-sm text-charcoal/55">
            Live customer, booking, payment, membership and delivery updates.
          </p>
        </div>
        <form action={markAllAdminNotificationsReadFormAction}>
          <SubmitButton
            pendingLabel="Marking…"
            className={cn(
              "rounded-full border border-charcoal/15 px-4 py-2 text-xs text-charcoal/65",
              unreadCount === 0 && "pointer-events-none opacity-40"
            )}
          >
            Mark all read
          </SubmitButton>
        </form>
      </div>

      <p className="mt-6 text-xs uppercase tracking-[0.12em] text-charcoal/45">
        {unreadCount} unread · Latest {notifications.length}
      </p>

      {notifications.length === 0 ? (
        <div className="mt-4 rounded-2xl border border-charcoal/10 bg-ivory px-6 py-12 text-center">
          <p className="text-charcoal/55">No notifications yet. New activity will appear here automatically.</p>
        </div>
      ) : (
        <div className="mt-4 overflow-hidden rounded-2xl border border-charcoal/10 bg-ivory">
          {notifications.map((notification) => (
            <article
              key={notification.id}
              className={cn(
                "flex flex-col gap-3 border-b border-charcoal/5 px-5 py-4 last:border-0 sm:flex-row sm:items-start",
                !notification.isRead && "bg-clay/[0.04]"
              )}
            >
              <span className={cn("mt-0.5 w-fit rounded-full px-2.5 py-1 text-[10px] font-medium uppercase tracking-[0.08em]", SEVERITY_STYLES[notification.severity])}>
                {notification.severity}
              </span>
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2">
                  <h2 className="font-medium text-charcoal">{notification.title}</h2>
                  {!notification.isRead && <span className="h-2 w-2 rounded-full bg-clay" aria-label="Unread" />}
                </div>
                <p className="mt-1 text-sm leading-relaxed text-charcoal/65">{notification.message}</p>
                <p className="mt-1 text-xs text-charcoal/40">
                  {formatManilaDateTime(notification.createdAt)} PHT
                </p>
              </div>
              <div className="flex shrink-0 items-center gap-3">
                {notification.actionUrl && (
                  <Link href={notification.actionUrl} className="text-xs underline underline-offset-2 hover:text-charcoal">
                    View
                  </Link>
                )}
                {!notification.isRead && (
                  <form action={markAdminNotificationReadFormAction.bind(null, notification.id)}>
                    <SubmitButton pendingLabel="…" className="text-xs text-charcoal/50 underline underline-offset-2 hover:text-charcoal">
                      Mark read
                    </SubmitButton>
                  </form>
                )}
              </div>
            </article>
          ))}
        </div>
      )}
    </div>
  );
}
