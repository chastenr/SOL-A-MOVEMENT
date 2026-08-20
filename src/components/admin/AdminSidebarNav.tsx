"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  Bell,
  CalendarDays,
  ClipboardCheck,
  CreditCard,
  Dumbbell,
  LayoutDashboard,
  Settings2,
  UserRoundCheck,
  UsersRound,
  type LucideIcon,
} from "lucide-react";
import { cn } from "@/lib/utils";

const ICONS = {
  dashboard: LayoutDashboard,
  notifications: Bell,
  calendar: CalendarDays,
  bookings: ClipboardCheck,
  customers: UsersRound,
  payments: CreditCard,
  classes: Dumbbell,
  coaches: UserRoundCheck,
  settings: Settings2,
} satisfies Record<string, LucideIcon>;

type NavItem = {
  href: string;
  label: string;
  icon: keyof typeof ICONS;
  section: string;
  badge?: number;
  matchPrefixes?: readonly string[];
};

export function AdminSidebarNav({ items }: { items: readonly NavItem[] }) {
  const pathname = usePathname();
  const sections = items.reduce<Array<{ label: string; items: NavItem[] }>>((groups, item) => {
    const currentGroup = groups.at(-1);

    if (currentGroup?.label === item.section) {
      currentGroup.items.push(item);
    } else {
      groups.push({ label: item.section, items: [item] });
    }

    return groups;
  }, []);

  return (
    <nav aria-label="Admin navigation" className="overflow-x-auto px-3 pb-4 lg:overflow-visible lg:pb-6">
      <div className="flex min-w-max gap-1.5 lg:min-w-0 lg:flex-col lg:gap-5">
        {sections.map((section) => (
          <section key={section.label} aria-label={section.label}>
            <p
              aria-hidden
              className="mb-1 hidden px-3 text-[10px] font-semibold uppercase tracking-[0.16em] text-ivory/30 lg:block"
            >
              {section.label}
            </p>
            <div className="flex gap-1.5 lg:flex-col lg:gap-1">
              {section.items.map((item) => {
                const Icon = ICONS[item.icon];
                // /admin itself must match exactly — every other admin route starts
                // with /admin, which would otherwise make "Dashboard" look active
                // everywhere. matchPrefixes covers grouped hubs (e.g. "Settings"
                // linking out to /admin/packages, /admin/security, etc.) whose
                // sub-pages live outside the hub's own URL prefix.
                const isActive =
                  item.href === "/admin"
                    ? pathname === "/admin"
                    : pathname.startsWith(item.href) ||
                      (item.matchPrefixes?.some((prefix) => pathname.startsWith(prefix)) ?? false);

                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    aria-current={isActive ? "page" : undefined}
                    className={cn(
                      "group relative flex min-h-11 items-center gap-3 whitespace-nowrap rounded-xl px-3 py-2 text-sm font-medium transition-all",
                      isActive
                        ? "bg-ivory/10 text-ivory shadow-[inset_0_1px_0_rgba(255,255,255,0.04)]"
                        : "text-ivory/65 hover:bg-ivory/[0.06] hover:text-ivory"
                    )}
                  >
                    {isActive && (
                      <span className="absolute inset-y-2 left-0 w-0.5 rounded-full bg-clay" aria-hidden />
                    )}
                    <span
                      className={cn(
                        "flex h-8 w-8 shrink-0 items-center justify-center rounded-lg transition-colors",
                        isActive
                          ? "bg-clay/20 text-clay"
                          : "bg-ivory/[0.04] text-ivory/45 group-hover:bg-ivory/[0.08] group-hover:text-ivory"
                      )}
                    >
                      <Icon size={17} strokeWidth={1.8} aria-hidden />
                    </span>
                    <span className="flex-1">{item.label}</span>
                    {(item.badge ?? 0) > 0 && (
                      <span className="min-w-5 rounded-full bg-clay px-1.5 text-center text-[10px] font-semibold leading-5 text-ivory">
                        {(item.badge ?? 0) > 99 ? "99+" : item.badge}
                      </span>
                    )}
                  </Link>
                );
              })}
            </div>
          </section>
        ))}
      </div>
    </nav>
  );
}
