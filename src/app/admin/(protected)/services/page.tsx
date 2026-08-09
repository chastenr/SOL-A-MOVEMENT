import type { Metadata } from "next";
import Link from "next/link";
import { requireAdmin } from "@/lib/auth/require-role";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { Button } from "@/components/ui/Button";
import { setServiceActiveAction } from "./actions";

export const metadata: Metadata = {
  title: "Services",
  robots: { index: false, follow: false },
};

type ServiceRow = {
  id: string;
  slug: string;
  name: string;
  category: string;
  duration: string;
  is_active: boolean;
  sort_order: number;
};

export default async function AdminServicesPage() {
  await requireAdmin();
  const supabase = await createSupabaseServerClient();
  const { data, error } = await supabase
    .from("services")
    .select("id, slug, name, category, duration, is_active, sort_order")
    .order("sort_order");

  const services = (data as ServiceRow[] | null) ?? [];

  return (
    <div>
      <div className="flex items-center justify-between gap-4">
        <h1 className="font-display text-2xl text-charcoal">Services</h1>
        <Button href="/admin/services/new">Create Service</Button>
      </div>

      {error && (
        <p className="mt-6 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          Couldn&rsquo;t load services. Has the database migration been run yet? ({error.message})
        </p>
      )}

      {!error && services.length === 0 && <p className="mt-6 text-charcoal/60">No services yet.</p>}

      {services.length > 0 && (
        <div className="mt-6 overflow-x-auto rounded-xl border border-charcoal/10 bg-ivory">
          <table className="w-full min-w-[640px] text-left text-sm">
            <thead className="border-b border-charcoal/10 text-xs uppercase tracking-[0.08em] text-charcoal/45">
              <tr>
                <th className="px-4 py-3">Name</th>
                <th className="px-4 py-3">Category</th>
                <th className="px-4 py-3">Duration</th>
                <th className="px-4 py-3">Status</th>
                <th className="px-4 py-3" />
              </tr>
            </thead>
            <tbody>
              {services.map((service) => (
                <tr key={service.id} className="border-b border-charcoal/5 last:border-0">
                  <td className="px-4 py-3">
                    <Link href={`/admin/services/${service.id}`} className="font-medium text-charcoal hover:underline">
                      {service.name}
                    </Link>
                    <p className="text-xs text-charcoal/45">{service.slug}</p>
                  </td>
                  <td className="px-4 py-3 text-charcoal/70">{service.category}</td>
                  <td className="px-4 py-3 text-charcoal/70">{service.duration}</td>
                  <td className="px-4 py-3">
                    <span
                      className={
                        service.is_active
                          ? "rounded-full bg-clay/10 px-2.5 py-1 text-xs text-clay"
                          : "rounded-full bg-charcoal/10 px-2.5 py-1 text-xs text-charcoal/50"
                      }
                    >
                      {service.is_active ? "Active" : "Inactive"}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-right">
                    <form action={setServiceActiveAction.bind(null, service.id, !service.is_active)}>
                      <button type="submit" className="text-xs underline underline-offset-2 hover:text-charcoal">
                        {service.is_active ? "Deactivate" : "Activate"}
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
