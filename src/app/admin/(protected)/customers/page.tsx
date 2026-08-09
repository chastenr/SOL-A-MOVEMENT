import type { Metadata } from "next";
import Link from "next/link";
import { format } from "date-fns";
import { requireAdmin } from "@/lib/auth/require-role";
import { getAdminCustomers } from "@/lib/admin/customers";
import { fieldInputClasses } from "@/components/ui/Field";
import { cn } from "@/lib/utils";

export const metadata: Metadata = {
  title: "Customers",
  robots: { index: false, follow: false },
};

export default async function AdminCustomersPage({
  searchParams,
}: {
  searchParams: Promise<{ search?: string }>;
}) {
  await requireAdmin();
  const params = await searchParams;
  const customers = await getAdminCustomers({ search: params.search });

  return (
    <div>
      <h1 className="font-display text-2xl text-charcoal">Customers</h1>
      <p className="mt-1 text-sm text-charcoal/55">Every account registered on the website.</p>

      <form method="GET" className="mt-6">
        <input
          type="text"
          name="search"
          defaultValue={params.search}
          placeholder="Search by name or email"
          className={`${fieldInputClasses} max-w-sm`}
        />
      </form>

      {customers.length === 0 ? (
        <p className="mt-8 text-charcoal/60">No customers match yet.</p>
      ) : (
        <div className="mt-6 overflow-x-auto rounded-xl border border-charcoal/10 bg-ivory">
          <table className="w-full min-w-[640px] text-left text-sm">
            <thead className="border-b border-charcoal/10 text-xs uppercase tracking-[0.08em] text-charcoal/45">
              <tr>
                <th className="px-4 py-3">Name</th>
                <th className="px-4 py-3">Email</th>
                <th className="px-4 py-3">Phone</th>
                <th className="px-4 py-3">Credits</th>
                <th className="px-4 py-3">Joined</th>
              </tr>
            </thead>
            <tbody>
              {customers.map((customer) => (
                <tr key={customer.id} className="border-b border-charcoal/5 last:border-0">
                  <td className="px-4 py-3">
                    <Link href={`/admin/customers/${customer.id}`} className="font-medium text-charcoal hover:underline">
                      {customer.name}
                    </Link>
                  </td>
                  <td className="px-4 py-3 text-charcoal/70">{customer.email}</td>
                  <td className="px-4 py-3 text-charcoal/70">{customer.mobileNumber || "—"}</td>
                  <td className="px-4 py-3">
                    <span
                      className={cn(
                        "rounded-full px-2.5 py-0.5 text-xs font-medium",
                        customer.activeCredits > 0 ? "bg-clay/10 text-clay" : "bg-charcoal/10 text-charcoal/45"
                      )}
                    >
                      {customer.activeCredits}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-charcoal/70">{format(new Date(customer.createdAt), "MMM d, yyyy")}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
