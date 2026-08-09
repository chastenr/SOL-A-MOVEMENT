import type { Metadata } from "next";
import Link from "next/link";
import { requireAdmin } from "@/lib/auth/require-role";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { Button } from "@/components/ui/Button";
import { setPackageActiveAction } from "./actions";

export const metadata: Metadata = {
  title: "Packages",
  robots: { index: false, follow: false },
};

type PackageRow = {
  id: string;
  slug: string;
  name: string;
  category: string;
  price_centavos: number;
  credit_count: number | null;
  is_active: boolean;
  sort_order: number;
};

export default async function AdminPackagesPage() {
  await requireAdmin();
  const supabase = await createSupabaseServerClient();
  const { data, error } = await supabase
    .from("packages")
    .select("id, slug, name, category, price_centavos, credit_count, is_active, sort_order")
    .order("sort_order");

  const packages = (data as PackageRow[] | null) ?? [];

  return (
    <div>
      <div className="flex items-center justify-between gap-4">
        <h1 className="font-display text-2xl text-charcoal">Packages</h1>
        <Button href="/admin/packages/new">Create Package</Button>
      </div>

      {error && (
        <p className="mt-6 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          Couldn&rsquo;t load packages. Has the database migration been run yet? ({error.message})
        </p>
      )}

      {!error && packages.length === 0 && (
        <p className="mt-6 text-charcoal/60">No packages yet.</p>
      )}

      {packages.length > 0 && (
        <div className="mt-6 overflow-x-auto rounded-xl border border-charcoal/10 bg-ivory">
          <table className="w-full min-w-[720px] text-left text-sm">
            <thead className="border-b border-charcoal/10 text-xs uppercase tracking-[0.08em] text-charcoal/45">
              <tr>
                <th className="px-4 py-3">Name</th>
                <th className="px-4 py-3">Category</th>
                <th className="px-4 py-3">Price</th>
                <th className="px-4 py-3">Credits</th>
                <th className="px-4 py-3">Status</th>
                <th className="px-4 py-3" />
              </tr>
            </thead>
            <tbody>
              {packages.map((pkg) => (
                <tr key={pkg.id} className="border-b border-charcoal/5 last:border-0">
                  <td className="px-4 py-3">
                    <Link href={`/admin/packages/${pkg.id}`} className="font-medium text-charcoal hover:underline">
                      {pkg.name}
                    </Link>
                    <p className="text-xs text-charcoal/45">{pkg.slug}</p>
                  </td>
                  <td className="px-4 py-3 text-charcoal/70">{pkg.category}</td>
                  <td className="px-4 py-3 text-charcoal/70">₱{(pkg.price_centavos / 100).toLocaleString()}</td>
                  <td className="px-4 py-3 text-charcoal/70">{pkg.credit_count ?? "—"}</td>
                  <td className="px-4 py-3">
                    <span
                      className={
                        pkg.is_active
                          ? "rounded-full bg-clay/10 px-2.5 py-1 text-xs text-clay"
                          : "rounded-full bg-charcoal/10 px-2.5 py-1 text-xs text-charcoal/50"
                      }
                    >
                      {pkg.is_active ? "Active" : "Inactive"}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-right">
                    <form action={setPackageActiveAction.bind(null, pkg.id, !pkg.is_active)}>
                      <button type="submit" className="text-xs underline underline-offset-2 hover:text-charcoal">
                        {pkg.is_active ? "Deactivate" : "Activate"}
                      </button>
                    </form>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
