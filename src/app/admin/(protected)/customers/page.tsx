import type { Metadata } from "next";
import Link from "next/link";
import {
  ArrowRight,
  CheckCircle2,
  Search,
  ShieldAlert,
  TicketCheck,
  UserRoundSearch,
  UsersRound,
} from "lucide-react";
import { requireAdmin } from "@/lib/auth/require-role";
import { getAdminCustomers, type AdminCustomerRow, type AdminCustomerStatus } from "@/lib/admin/customers";
import { fieldInputClasses } from "@/components/ui/Field";
import { formatManilaDate } from "@/lib/manila-time";
import { cn } from "@/lib/utils";

export const metadata: Metadata = {
  title: "Customers",
  robots: { index: false, follow: false },
};

const STATUS_FILTERS: Array<{ value: AdminCustomerStatus; label: string }> = [
  { value: "all", label: "All clients" },
  { value: "verified", label: "Phone verified" },
  { value: "unverified", label: "Needs verification" },
  { value: "with_credits", label: "Has credits" },
  { value: "no_credits", label: "No credits" },
];

function parseStatus(value?: string): AdminCustomerStatus {
  return STATUS_FILTERS.some((filter) => filter.value === value) ? (value as AdminCustomerStatus) : "all";
}

function filterCustomers(customers: AdminCustomerRow[], status: AdminCustomerStatus) {
  switch (status) {
    case "verified": return customers.filter((customer) => customer.phoneVerified);
    case "unverified": return customers.filter((customer) => !customer.phoneVerified);
    case "with_credits": return customers.filter((customer) => customer.activeCredits > 0);
    case "no_credits": return customers.filter((customer) => customer.activeCredits === 0);
    default: return customers;
  }
}

function getInitials(name: string) {
  return name.split(/\s+/).filter(Boolean).slice(0, 2).map((part) => part[0]?.toUpperCase()).join("") || "V";
}

export default async function AdminCustomersPage({
  searchParams,
}: {
  searchParams: Promise<{ search?: string; status?: string }>;
}) {
  await requireAdmin();
  const params = await searchParams;
  const search = params.search?.trim() ?? "";
  const status = parseStatus(params.status);
  const allCustomers = await getAdminCustomers({ search });
  const customers = filterCustomers(allCustomers, status);
  const verifiedCount = allCustomers.filter((customer) => customer.phoneVerified).length;
  const unverifiedCount = allCustomers.length - verifiedCount;
  const withCreditsCount = allCustomers.filter((customer) => customer.activeCredits > 0).length;

  function filterHref(nextStatus: AdminCustomerStatus) {
    const query = new URLSearchParams();
    if (search) query.set("search", search);
    if (nextStatus !== "all") query.set("status", nextStatus);
    const value = query.toString();
    return value ? `/admin/customers?${value}` : "/admin/customers";
  }

  const summaryCards = [
    { label: search ? "Matching clients" : "Total clients", value: allCustomers.length, icon: UsersRound, tone: "text-clay bg-clay/10" },
    { label: "Phone verified", value: verifiedCount, icon: CheckCircle2, tone: "text-emerald-700 bg-emerald-100" },
    { label: "Needs verification", value: unverifiedCount, icon: ShieldAlert, tone: "text-amber-700 bg-amber-100" },
    { label: "Clients with credits", value: withCreditsCount, icon: TicketCheck, tone: "text-charcoal/65 bg-charcoal/[0.06]" },
  ];

  return (
    <div>
      <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="text-xs font-medium uppercase tracking-[0.16em] text-clay">Client management</p>
          <h1 className="font-display mt-1 text-3xl text-charcoal">Customers</h1>
          <p className="mt-1 text-sm text-charcoal/55">Search accounts, check verification, and manage packages or credits.</p>
        </div>
        <span className="w-fit rounded-full bg-charcoal/[0.06] px-3 py-1.5 text-xs font-medium text-charcoal/55">
          {customers.length} {customers.length === 1 ? "result" : "results"}
        </span>
      </div>

      <section className="mt-7 grid grid-cols-2 gap-3 xl:grid-cols-4" aria-label="Customer summary">
        {summaryCards.map((card) => {
          const Icon = card.icon;
          return (
            <div key={card.label} className="rounded-2xl border border-charcoal/10 bg-ivory p-4 sm:p-5">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <p className="font-display text-3xl text-charcoal">{card.value}</p>
                  <p className="mt-1 text-[10px] font-semibold uppercase tracking-[0.1em] text-charcoal/45 sm:text-xs">{card.label}</p>
                </div>
                <span className={cn("flex h-9 w-9 shrink-0 items-center justify-center rounded-xl", card.tone)}>
                  <Icon size={17} strokeWidth={1.8} aria-hidden />
                </span>
              </div>
            </div>
          );
        })}
      </section>

      <section className="mt-6 rounded-2xl border border-charcoal/10 bg-ivory p-4 sm:p-5" aria-label="Search and filter customers">
        <form method="GET" className="flex flex-col gap-3 sm:flex-row">
          {status !== "all" && <input type="hidden" name="status" value={status} />}
          <div className="relative flex-1">
            <Search size={18} className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-charcoal/35" aria-hidden />
            <input
              type="search"
              name="search"
              defaultValue={search}
              placeholder="Search name, email, or phone number"
              aria-label="Search customers by name, email, or phone number"
              className={cn(fieldInputClasses, "w-full pl-11")}
            />
          </div>
          <button type="submit" className="inline-flex min-h-11 items-center justify-center rounded-xl bg-charcoal px-6 text-xs font-semibold uppercase tracking-[0.12em] text-ivory transition-colors hover:bg-clay focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-clay">
            Search
          </button>
          {(search || status !== "all") && (
            <Link href="/admin/customers" className="inline-flex min-h-11 items-center justify-center rounded-xl border border-charcoal/15 px-5 text-xs font-semibold uppercase tracking-[0.1em] text-charcoal/65 transition-colors hover:border-charcoal/35 hover:text-charcoal">
              Clear
            </Link>
          )}
        </form>

        <div className="mt-4 flex gap-2 overflow-x-auto pb-1" aria-label="Filter customer list">
          {STATUS_FILTERS.map((filter) => (
            <Link
              key={filter.value}
              href={filterHref(filter.value)}
              aria-current={status === filter.value ? "page" : undefined}
              className={cn(
                "shrink-0 rounded-full border px-3.5 py-2 text-xs font-medium transition-colors",
                status === filter.value ? "border-charcoal bg-charcoal text-ivory" : "border-charcoal/10 text-charcoal/55 hover:border-charcoal/25 hover:text-charcoal"
              )}
            >
              {filter.label}
            </Link>
          ))}
        </div>
      </section>

      {customers.length === 0 ? (
        <div className="mt-6 rounded-2xl border border-dashed border-charcoal/15 bg-ivory/60 px-6 py-12 text-center">
          <span className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl bg-charcoal/[0.05] text-charcoal/40"><UserRoundSearch size={22} aria-hidden /></span>
          <p className="font-display mt-4 text-lg text-charcoal">No matching clients</p>
          <p className="mt-1 text-sm text-charcoal/50">Try another search or clear the current filters.</p>
          <Link href="/admin/customers" className="mt-4 inline-flex text-sm font-medium text-clay hover:underline">View all customers</Link>
        </div>
      ) : (
        <>
          <div className="mt-6 hidden overflow-x-auto rounded-2xl border border-charcoal/10 bg-ivory lg:block">
            <table className="w-full min-w-[880px] text-left text-sm">
              <thead className="border-b border-charcoal/10 bg-charcoal/[0.018] text-[10px] font-semibold uppercase tracking-[0.12em] text-charcoal/45">
                <tr>
                  <th className="px-5 py-3.5">Customer</th><th className="px-5 py-3.5">Phone status</th><th className="px-5 py-3.5">Available credits</th><th className="px-5 py-3.5">Joined</th><th className="px-5 py-3.5 text-right"><span className="sr-only">Actions</span></th>
                </tr>
              </thead>
              <tbody>
                {customers.map((customer) => (
                  <tr key={customer.id} className="border-b border-charcoal/[0.06] transition-colors last:border-0 hover:bg-charcoal/[0.018]">
                    <td className="px-5 py-4">
                      <div className="flex items-center gap-3">
                        <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-clay/10 text-xs font-semibold text-clay">{getInitials(customer.name)}</span>
                        <div className="min-w-0">
                          <Link href={`/admin/customers/${customer.id}`} className="font-medium text-charcoal hover:text-clay hover:underline">{customer.name}</Link>
                          <p className="mt-0.5 max-w-72 truncate text-xs text-charcoal/45">{customer.email}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-5 py-4">
                      <p className="text-charcoal/65">{customer.mobileNumber || "Not provided"}</p>
                      <span className={cn("mt-1 inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-semibold uppercase tracking-[0.06em]", customer.phoneVerified ? "bg-emerald-100 text-emerald-700" : "bg-amber-100 text-amber-800")}>
                        {customer.phoneVerified ? <CheckCircle2 size={11} aria-hidden /> : <ShieldAlert size={11} aria-hidden />}
                        {customer.phoneVerified ? "Verified" : "Pending"}
                      </span>
                    </td>
                    <td className="px-5 py-4">
                      <span className={cn("inline-flex min-w-9 justify-center rounded-full px-2.5 py-1 text-xs font-semibold", customer.activeCredits > 0 ? "bg-clay/10 text-clay" : "bg-charcoal/[0.06] text-charcoal/40")}>{customer.activeCredits}</span>
                    </td>
                    <td className="px-5 py-4 text-charcoal/55">{formatManilaDate(customer.createdAt)}</td>
                    <td className="px-5 py-4 text-right">
                      <Link href={`/admin/customers/${customer.id}`} className="group inline-flex min-h-9 items-center gap-2 rounded-full border border-charcoal/15 px-4 text-xs font-semibold uppercase tracking-[0.08em] text-charcoal transition-colors hover:border-charcoal hover:bg-charcoal hover:text-ivory" aria-label={`Open profile for ${customer.name}`}>
                        View profile <ArrowRight size={13} className="transition-transform group-hover:translate-x-0.5" aria-hidden />
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className="mt-6 grid gap-3 lg:hidden">
            {customers.map((customer) => (
              <article key={customer.id} className="rounded-2xl border border-charcoal/10 bg-ivory p-4">
                <div className="flex items-start gap-3">
                  <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-clay/10 text-xs font-semibold text-clay">{getInitials(customer.name)}</span>
                  <div className="min-w-0 flex-1"><p className="truncate font-medium text-charcoal">{customer.name}</p><p className="mt-0.5 truncate text-xs text-charcoal/45">{customer.email}</p></div>
                  <span className={cn("shrink-0 rounded-full px-2.5 py-1 text-xs font-semibold", customer.activeCredits > 0 ? "bg-clay/10 text-clay" : "bg-charcoal/[0.06] text-charcoal/40")}>{customer.activeCredits} credits</span>
                </div>
                <div className="mt-4 grid grid-cols-2 gap-3 border-y border-charcoal/[0.06] py-3 text-xs">
                  <div><p className="text-charcoal/40">Phone</p><p className="mt-1 truncate text-charcoal/65">{customer.mobileNumber || "Not provided"}</p></div>
                  <div><p className="text-charcoal/40">Joined</p><p className="mt-1 text-charcoal/65">{formatManilaDate(customer.createdAt)}</p></div>
                </div>
                <div className="mt-3 flex items-center justify-between gap-3">
                  <span className={cn("inline-flex items-center gap-1.5 text-xs font-medium", customer.phoneVerified ? "text-emerald-700" : "text-amber-700")}>
                    {customer.phoneVerified ? <CheckCircle2 size={14} aria-hidden /> : <ShieldAlert size={14} aria-hidden />}
                    {customer.phoneVerified ? "Phone verified" : "Verification pending"}
                  </span>
                  <Link href={`/admin/customers/${customer.id}`} className="inline-flex min-h-10 items-center gap-1.5 text-xs font-semibold uppercase tracking-[0.08em] text-charcoal hover:text-clay">Open <ArrowRight size={13} aria-hidden /></Link>
                </div>
              </article>
            ))}
          </div>
        </>
      )}
    </div>
  );
}
