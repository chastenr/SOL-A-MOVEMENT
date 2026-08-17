import type { Metadata } from "next";
import Link from "next/link";
import { requireSuperAdmin } from "@/lib/auth/require-role";

export const metadata: Metadata = {
  title: "Settings",
  robots: { index: false, follow: false },
};

// Payment Methods and Class Times used to live here as their own pages —
// both moved to live inline on the operational page they belong next to
// (Payments and Classes) instead, so switching between "review this" and
// "configure that" doesn't cost a full page navigation.
const SETTINGS_LINKS = [
  { href: "/admin/packages", label: "Packages", description: "The credit packages customers can buy — name, category, price, credits." },
  { href: "/admin/services", label: "Services", description: "The service types shown across the site (Mat Pilates, Yoga, Barre, and so on)." },
  { href: "/admin/security", label: "Security", description: "Your own admin login — password, email, two-factor." },
] as const;

const SUPER_ADMIN_LINKS = [
  { href: "/admin/users", label: "Users", description: "Who has admin access to this dashboard." },
  { href: "/admin/logs", label: "Activity Log", description: "A record of admin actions across the system." },
] as const;

export default async function AdminSettingsPage() {
  const admin = await requireSuperAdmin();
  const links = admin.role === "super_admin" ? [...SETTINGS_LINKS, ...SUPER_ADMIN_LINKS] : SETTINGS_LINKS;

  return (
    <div>
      <h1 className="font-display text-2xl text-charcoal">Settings</h1>
      <p className="mt-1 text-sm text-charcoal/55">
        Things you set up once and rarely change — day-to-day work happens in the other tabs.
      </p>

      <div className="mt-6 grid gap-4 sm:grid-cols-2">
        {links.map((link) => (
          <Link
            key={link.href}
            href={link.href}
            className="rounded-2xl border border-charcoal/10 bg-ivory p-5 transition-colors hover:border-charcoal/25"
          >
            <p className="font-display text-lg text-charcoal">{link.label}</p>
            <p className="mt-1 text-sm text-charcoal/55">{link.description}</p>
          </Link>
        ))}
      </div>
    </div>
  );
}
