import Link from "next/link";
import { requireUser } from "@/lib/auth/require-role";

const NAV = [
  { href: "/account", label: "Overview" },
  { href: "/account/packages", label: "My Packages" },
  { href: "/account/book", label: "Book a Class" },
  { href: "/account/bookings", label: "My Bookings" },
  { href: "/account/payments", label: "Payment History" },
  { href: "/account/profile", label: "Profile" },
  { href: "/account/security", label: "Security" },
] as const;

export default async function AccountLayout({ children }: { children: React.ReactNode }) {
  await requireUser();

  return (
    <section className="mx-auto max-w-6xl px-6 pt-28 pb-16 sm:px-8 sm:pb-20 lg:px-12">
      <div className="gap-10 lg:grid lg:grid-cols-[220px_1fr]">
        <nav className="mb-8 flex gap-1 overflow-x-auto lg:mb-0 lg:flex-col lg:overflow-visible">
          {NAV.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className="whitespace-nowrap rounded-lg px-3 py-2 text-sm text-charcoal/60 transition-colors hover:bg-cream/60 hover:text-charcoal"
            >
              {item.label}
            </Link>
          ))}
        </nav>
        <div className="min-w-0">{children}</div>
      </div>
    </section>
  );
}
