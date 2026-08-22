import { requireAdmin } from "@/lib/auth/require-role";
import { logoutAction } from "@/lib/auth/actions";
import { AdminSidebarNav } from "@/components/admin/AdminSidebarNav";
import { ROLE_LABEL } from "@/lib/admin/role-labels";
import { cn } from "@/lib/utils";
import { getAdminNotifications } from "@/lib/admin/notifications";
import { AdminNotificationBell } from "@/components/admin/AdminNotificationBell";

// Kept short on purpose — the owner using this day to day shouldn't have to
// scan a dozen tabs. Anything edited rarely (catalog, payment methods,
// account security, staff access) lives one click deeper, under Settings,
// instead of getting its own row here.
const NAV = [
  { href: "/admin", label: "Dashboard", icon: "dashboard", section: "Overview" },
  { href: "/admin/notifications", label: "Notifications", icon: "notifications", section: "Overview" },
  { href: "/admin/calendar", label: "Calendar", icon: "calendar", section: "Schedule" },
  { href: "/admin/bookings", label: "Bookings", icon: "bookings", section: "Schedule" },
  { href: "/admin/classes", label: "Classes", icon: "classes", section: "Schedule" },
  { href: "/admin/customers", label: "Customers", icon: "customers", section: "People" },
  { href: "/admin/coaches", label: "Coaches", icon: "coaches", section: "People" },
  { href: "/admin/payments", label: "Payments", icon: "payments", section: "Management" },
  { href: "/admin/memberships", label: "Memberships", icon: "memberships", section: "Management" },
  {
    href: "/admin/settings",
    label: "Settings",
    icon: "settings",
    section: "Management",
    matchPrefixes: ["/admin/packages", "/admin/services", "/admin/security", "/admin/users", "/admin/logs"],
  },
] as const;

const ROLE_BADGE: Record<string, string> = {
  super_admin: "bg-clay text-ivory",
  admin: "bg-charcoal/10 text-charcoal/70",
};

// Every page under this group calls requireAdmin() here — Server Component
// pages re-execute per navigation even under a shared layout, but this is
// still the first, cheap layer; every admin page/action re-checks itself too
// (defense in depth — see src/lib/auth/require-role.ts).
export default async function AdminProtectedLayout({ children }: { children: React.ReactNode }) {
  const admin = await requireAdmin();
  const notificationFeed = await getAdminNotifications(admin.id, 100);
  const navItems = NAV
    .filter((item) => admin.role === "super_admin" || (!["/admin/payments", "/admin/memberships", "/admin/settings"].includes(item.href)))
    .map((item) => item.href === "/admin/notifications"
      ? { ...item, badge: notificationFeed.unreadCount }
      : item);

  return (
    <div className="min-h-screen bg-plaster lg:flex">
      <aside className="border-b border-ivory/10 bg-walnut text-ivory lg:min-h-screen lg:w-64 lg:shrink-0 lg:border-b-0 lg:border-r">
        <div className="flex items-center gap-3 px-5 py-5 lg:py-6">
          <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl border border-ivory/10 bg-ivory/[0.06] shadow-[inset_0_1px_0_rgba(255,255,255,0.04)]">
            <span
              aria-hidden
              className="h-8 w-7 bg-clay [mask-image:url('/veora-mark.png')] [mask-position:center] [mask-repeat:no-repeat] [mask-size:contain]"
            />
          </span>
          <div>
            <p className="font-display text-lg leading-tight tracking-[0.02em]">Veora Admin</p>
            <p className="mt-0.5 text-[10px] uppercase tracking-[0.18em] text-ivory/35">Studio operations</p>
          </div>
        </div>
        <AdminSidebarNav items={navItems} />
      </aside>

      <div className="flex-1">
        <header className="flex items-center justify-end border-b border-charcoal/10 bg-ivory px-4 py-4 sm:justify-between sm:px-8">
          <p className="hidden text-sm text-charcoal/45 sm:block">Signed in</p>
          <div className="flex min-w-0 items-center gap-2 text-sm text-charcoal/60 sm:gap-4">
            <AdminNotificationBell
              adminId={admin.id}
              initialNotifications={notificationFeed.notifications.slice(0, 20)}
              initialUnreadCount={notificationFeed.unreadCount}
            />
            <span className="flex min-w-0 items-center gap-2">
              <span className="max-w-32 truncate sm:max-w-none">{admin.email}</span>
              <span
                className={cn(
                  "shrink-0 rounded-full px-2.5 py-0.5 text-[10px] font-medium uppercase tracking-[0.1em]",
                  ROLE_BADGE[admin.role] ?? "bg-charcoal/10 text-charcoal/70"
                )}
              >
                {ROLE_LABEL[admin.role]}
              </span>
            </span>
            <form action={logoutAction} className="shrink-0">
              <button type="submit" className="underline underline-offset-2 hover:text-charcoal">
                Log Out
              </button>
            </form>
          </div>
        </header>
        <main className="texture-plaster mx-auto max-w-6xl px-6 py-10 sm:px-8">{children}</main>
      </div>
    </div>
  );
}
