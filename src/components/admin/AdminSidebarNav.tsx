"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";

type NavItem = { href: string; label: string };

export function AdminSidebarNav({ items }: { items: readonly NavItem[] }) {
  const pathname = usePathname();

  return (
    <nav className="flex gap-1 overflow-x-auto px-4 pb-4 lg:flex-col lg:overflow-visible lg:px-3">
      {items.map((item) => {
        // /admin itself must match exactly — every other admin route starts
        // with /admin, which would otherwise make "Dashboard" look active
        // everywhere.
        const isActive = item.href === "/admin" ? pathname === "/admin" : pathname.startsWith(item.href);
        return (
          <Link
            key={item.href}
            href={item.href}
            className={cn(
              "relative whitespace-nowrap rounded-lg px-3 py-2 text-sm transition-colors",
              isActive ? "bg-ivory/10 text-ivory" : "text-ivory/60 hover:bg-ivory/5 hover:text-ivory"
            )}
          >
            {isActive && (
              <span className="absolute inset-y-1.5 left-0 w-0.5 rounded-full bg-clay lg:inset-y-2" aria-hidden />
            )}
            {item.label}
          </Link>
        );
      })}
    </nav>
  );
}
