import Link from "next/link";
import { requireAdmin } from "@/lib/auth/require-role";
import { logoutAction } from "@/lib/auth/actions";

const NAV = [
  { href: "/admin", label: "Dashboard" },
  { href: "/admin/calendar", label: "Calendar" },
  { href: "/admin/bookings", label: "Bookings" },
  { href: "/admin/payments", label: "Payments" },
  { href: "/admin/classes", label: "Classes" },
  { href: "/admin/packages", label: "Packages" },
  { href: "/admin/services", label: "Services" },
  { href: "/admin/security", label: "Security" },
] as const;

// Every page under this group calls requireAdmin() here — Server Component
// pages re-execute per navigation even under a shared layout, but this is
// still the first, cheap layer; every admin page/action re-checks itself too
// (defense in depth — see src/lib/auth/require-role.ts).
export default async function AdminProtectedLayout({ children }: { children: React.ReactNode }) {
  const admin = await requireAdmin();

  return (
    <div className="min-h-screen bg-cream/40 lg:flex">
      <aside className="border-b border-charcoal/10 bg-charcoal text-ivory lg:min-h-screen lg:w-56 lg:shrink-0 lg:border-b-0 lg:border-r lg:border-ivory/10">
        <div className="px-6 py-5">
          <p className="font-display text-lg">Veora Admin</p>
        </div>
        <nav className="flex gap-1 overflow-x-auto px-4 pb-4 lg:flex-col lg:overflow-visible lg:px-3">
          {NAV.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className="whitespace-nowrap rounded-lg px-3 py-2 text-sm text-ivory/70 transition-colors hover:bg-ivory/10 hover:text-ivory"
            >
              {item.label}
            </Link>
          ))}
        </nav>
      </aside>

      <div className="flex-1">
        <header className="flex items-center justify-between border-b border-charcoal/10 bg-ivory px-6 py-4 sm:px-8">
          <p className="text-sm text-charcoal/60">Signed in</p>
          <div className="flex items-center gap-4 text-sm text-charcoal/60">
            <span>
              {admin.email} · <span className="uppercase tracking-[0.08em]">{admin.role}</span>
            </span>
            <form action={logoutAction}>
              <button type="submit" className="underline underline-offset-2 hover:text-charcoal">
                Log Out
              </button>
            </form>
          </div>
        </header>
        <main className="mx-auto max-w-6xl px-6 py-10 sm:px-8">{children}</main>
      </div>
    </div>
  );
}
