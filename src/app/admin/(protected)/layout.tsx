import { requireAdmin } from "@/lib/auth/require-role";
import { logoutAction } from "@/lib/auth/actions";
import { AdminSidebarNav } from "@/components/admin/AdminSidebarNav";
import { ROLE_LABEL } from "@/lib/admin/role-labels";
import { cn } from "@/lib/utils";

// Kept short on purpose — the owner using this day to day shouldn't have to
// scan a dozen tabs. Anything edited rarely (catalog, payment methods,
// account security, staff access) lives one click deeper, under Settings,
// instead of getting its own row here.
const NAV = [
  { href: "/admin", label: "Dashboard" },
  { href: "/admin/calendar", label: "Calendar" },
  { href: "/admin/bookings", label: "Bookings" },
  { href: "/admin/customers", label: "Customers" },
  { href: "/admin/payments", label: "Payments" },
  { href: "/admin/classes", label: "Classes" },
  { href: "/admin/coaches", label: "Coaches" },
  {
    href: "/admin/settings",
    label: "Settings",
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

  return (
    <div className="min-h-screen bg-plaster lg:flex">
      <aside className="border-b border-ivory/10 bg-walnut text-ivory lg:min-h-screen lg:w-56 lg:shrink-0 lg:border-b-0 lg:border-r">
        <div className="px-6 py-5">
          <p className="font-display text-lg tracking-[0.02em]">Veora Admin</p>
        </div>
        <AdminSidebarNav items={NAV} />
      </aside>

      <div className="flex-1">
        <header className="flex items-center justify-end border-b border-charcoal/10 bg-ivory px-4 py-4 sm:justify-between sm:px-8">
          <p className="hidden text-sm text-charcoal/45 sm:block">Signed in</p>
          <div className="flex min-w-0 items-center gap-2 text-sm text-charcoal/60 sm:gap-4">
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
