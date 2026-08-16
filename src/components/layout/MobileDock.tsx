"use client";

import Link from "next/link";
import { CalendarDays, House, LayoutGrid, Tag, UserRound } from "lucide-react";
import { cn } from "@/lib/utils";

type DockItem = {
  label: string;
  href: string;
  icon: typeof House;
  featured?: boolean;
  match: (path: string) => boolean;
};

const dockItems: DockItem[] = [
  { label: "Home", href: "/", icon: House, match: (path: string) => path === "/" },
  {
    label: "Classes",
    href: "/services",
    icon: LayoutGrid,
    match: (path: string) => path.startsWith("/services"),
  },
  {
    label: "Book",
    href: "/book",
    icon: CalendarDays,
    featured: true,
    match: (path: string) => path === "/book" || path.startsWith("/account/book"),
  },
  {
    label: "Plans",
    href: "/pricing",
    icon: Tag,
    match: (path: string) =>
      path === "/pricing" || path.startsWith("/checkout") || path.startsWith("/purchases"),
  },
  {
    label: "Contact",
    href: "/contact",
    icon: UserRound,
    match: (path: string) => path === "/contact",
  },
];

export function MobileDock({ pathname, onNavigate }: { pathname: string; onNavigate: () => void }) {
  return (
    <nav
      aria-label="Mobile navigation"
      className="font-navbar pointer-events-auto fixed inset-x-3 bottom-[max(0.75rem,env(safe-area-inset-bottom))] z-[70] mx-auto grid max-w-xl grid-cols-5 items-end rounded-[2rem] border border-charcoal/10 bg-cream/95 px-2 pb-2 pt-2 shadow-[0_18px_55px_-20px_rgba(34,31,28,0.55)] backdrop-blur-xl xl:hidden"
    >
      {dockItems.map((item) => {
        const active = item.match(pathname);
        const Icon = item.icon;

        if (item.featured) {
          return (
            <Link
              key={item.href}
              href={item.href}
              onClick={onNavigate}
              aria-current={active ? "page" : undefined}
              className="group flex min-w-0 flex-col items-center gap-1.5 text-center"
            >
              <span
                className={cn(
                  "-mt-5 flex h-16 w-16 items-center justify-center rounded-[1.4rem] border border-charcoal/10 bg-charcoal text-ivory shadow-[0_12px_28px_-14px_rgba(34,31,28,0.75)] transition-transform duration-300 group-active:scale-95",
                  active && "bg-walnut ring-2 ring-clay/35 ring-offset-2 ring-offset-cream"
                )}
              >
                <Icon size={25} strokeWidth={1.8} aria-hidden />
              </span>
              <span className="text-xs font-semibold tracking-[-0.01em] text-charcoal">{item.label}</span>
            </Link>
          );
        }

        return (
          <Link
            key={item.href}
            href={item.href}
            onClick={onNavigate}
            aria-current={active ? "page" : undefined}
            className="group flex min-w-0 flex-col items-center gap-1.5 rounded-2xl px-1 py-2 text-center"
          >
            <span
              className={cn(
                "flex h-10 w-10 items-center justify-center rounded-full text-taupe transition-colors duration-300 group-hover:bg-sand/65 group-hover:text-charcoal",
                active && "bg-sand text-charcoal"
              )}
            >
              <Icon size={22} strokeWidth={active ? 2 : 1.7} aria-hidden />
            </span>
            <span
              className={cn(
                "truncate text-xs font-medium tracking-[-0.01em] text-taupe",
                active && "font-semibold text-charcoal"
              )}
            >
              {item.label}
            </span>
          </Link>
        );
      })}
    </nav>
  );
}
