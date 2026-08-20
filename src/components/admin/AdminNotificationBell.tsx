"use client";

import { useEffect, useMemo, useState, useTransition } from "react";
import Link from "next/link";
import { Bell } from "lucide-react";
import { createSupabaseBrowserClient } from "@/lib/supabase/client";
import type { AdminNotification, AdminNotificationSeverity } from "@/lib/admin/notifications";
import {
  markAdminNotificationReadAction,
  markAllAdminNotificationsReadAction,
} from "@/app/admin/(protected)/notifications/actions";
import { formatManilaDateTime } from "@/lib/manila-time";
import { cn } from "@/lib/utils";

const SEVERITY_DOT: Record<AdminNotificationSeverity, string> = {
  info: "bg-sky-500",
  success: "bg-emerald-500",
  warning: "bg-amber-500",
  error: "bg-red-500",
};

type RealtimeNotificationRow = {
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

function mapRealtimeNotification(row: RealtimeNotificationRow): AdminNotification {
  return {
    id: row.id,
    type: row.type,
    title: row.title,
    message: row.message,
    severity: row.severity,
    actionUrl: row.action_url,
    entityType: row.entity_type,
    entityId: row.entity_id,
    createdAt: row.created_at,
    isRead: false,
  };
}

export function AdminNotificationBell({
  adminId,
  initialNotifications,
  initialUnreadCount,
}: {
  adminId: string;
  initialNotifications: AdminNotification[];
  initialUnreadCount: number;
}) {
  const supabase = useMemo(() => createSupabaseBrowserClient(), []);
  const [open, setOpen] = useState(false);
  const [notifications, setNotifications] = useState(initialNotifications);
  const [unreadCount, setUnreadCount] = useState(initialUnreadCount);
  const [isPending, startTransition] = useTransition();

  useEffect(() => {
    const channel = supabase
      .channel(`admin-notifications:${adminId}`)
      .on(
        "postgres_changes",
        { event: "INSERT", schema: "public", table: "admin_notifications" },
        (payload) => {
          const notification = mapRealtimeNotification(payload.new as RealtimeNotificationRow);
          setNotifications((current) => [notification, ...current.filter((item) => item.id !== notification.id)].slice(0, 20));
          setUnreadCount((count) => count + 1);
        }
      )
      .subscribe();

    return () => {
      void supabase.removeChannel(channel);
    };
  }, [adminId, supabase]);

  function markRead(notificationId: string) {
    const notification = notifications.find((item) => item.id === notificationId);
    if (!notification || notification.isRead) return;

    setNotifications((current) =>
      current.map((item) => item.id === notificationId ? { ...item, isRead: true } : item)
    );
    setUnreadCount((count) => Math.max(count - 1, 0));
    startTransition(async () => {
      const result = await markAdminNotificationReadAction(notificationId);
      if ("error" in result) {
        setNotifications((current) =>
          current.map((item) => item.id === notificationId ? { ...item, isRead: false } : item)
        );
        setUnreadCount((count) => count + 1);
      }
    });
  }

  function markAllRead() {
    if (unreadCount === 0) return;
    const previous = notifications;
    const previousCount = unreadCount;
    setNotifications((current) => current.map((item) => ({ ...item, isRead: true })));
    setUnreadCount(0);
    startTransition(async () => {
      const result = await markAllAdminNotificationsReadAction();
      if ("error" in result) {
        setNotifications(previous);
        setUnreadCount(previousCount);
      }
    });
  }

  return (
    <div className="relative">
      <button
        type="button"
        aria-label={unreadCount > 0 ? `${unreadCount} unread notifications` : "Notifications"}
        aria-expanded={open}
        onClick={() => setOpen((value) => !value)}
        className="relative rounded-full p-2 text-charcoal/60 transition-colors hover:bg-charcoal/5 hover:text-charcoal"
      >
        <Bell size={19} aria-hidden />
        {unreadCount > 0 && (
          <span className="absolute -right-0.5 -top-0.5 min-w-4 rounded-full bg-red-600 px-1 text-center text-[10px] font-semibold leading-4 text-white">
            {unreadCount > 99 ? "99+" : unreadCount}
          </span>
        )}
      </button>

      {open && (
        <div className="absolute right-0 z-50 mt-2 w-[min(24rem,calc(100vw-2rem))] overflow-hidden rounded-2xl border border-charcoal/10 bg-ivory shadow-xl">
          <div className="flex items-center justify-between border-b border-charcoal/10 px-4 py-3">
            <div>
              <p className="font-display text-base text-charcoal">Notifications</p>
              <p className="text-xs text-charcoal/45">Updates appear here live.</p>
            </div>
            <button
              type="button"
              disabled={isPending || unreadCount === 0}
              onClick={markAllRead}
              className="text-xs text-charcoal/55 underline underline-offset-2 disabled:opacity-40"
            >
              Mark all read
            </button>
          </div>

          <div className="max-h-[28rem] overflow-y-auto">
            {notifications.length === 0 ? (
              <p className="px-4 py-8 text-center text-sm text-charcoal/50">No notifications yet.</p>
            ) : (
              notifications.map((notification) => {
                const content = (
                  <>
                    <span className={cn("mt-1.5 h-2 w-2 shrink-0 rounded-full", SEVERITY_DOT[notification.severity])} />
                    <span className="min-w-0 flex-1">
                      <span className="block font-medium text-charcoal">{notification.title}</span>
                      <span className="mt-0.5 block text-xs leading-relaxed text-charcoal/60">{notification.message}</span>
                      <span className="mt-1 block text-[10px] uppercase tracking-[0.06em] text-charcoal/35">
                        {formatManilaDateTime(notification.createdAt)} PHT
                      </span>
                    </span>
                    {!notification.isRead && <span className="mt-1.5 h-2 w-2 shrink-0 rounded-full bg-clay" aria-label="Unread" />}
                  </>
                );

                const classes = cn(
                  "flex w-full items-start gap-3 border-b border-charcoal/5 px-4 py-3 text-left transition-colors last:border-0 hover:bg-charcoal/[0.03]",
                  !notification.isRead && "bg-clay/[0.04]"
                );

                return notification.actionUrl ? (
                  <Link
                    key={notification.id}
                    href={notification.actionUrl}
                    onClick={() => markRead(notification.id)}
                    className={classes}
                  >
                    {content}
                  </Link>
                ) : (
                  <button key={notification.id} type="button" onClick={() => markRead(notification.id)} className={classes}>
                    {content}
                  </button>
                );
              })
            )}
          </div>

          <Link
            href="/admin/notifications"
            onClick={() => setOpen(false)}
            className="block border-t border-charcoal/10 px-4 py-3 text-center text-xs font-medium text-charcoal/65 hover:bg-charcoal/[0.03]"
          >
            View all notifications
          </Link>
        </div>
      )}
    </div>
  );
}
