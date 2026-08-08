import type { Metadata } from "next";
import { requireAdmin } from "@/lib/auth/require-role";
import { Button } from "@/components/ui/Button";

export const metadata: Metadata = {
  title: "Admin Dashboard",
  robots: { index: false, follow: false },
};

export default async function AdminDashboardPage() {
  const admin = await requireAdmin();

  return (
    <div>
      <h1 className="font-display text-2xl text-charcoal">Dashboard</h1>
      <p className="mt-2 text-charcoal/60">
        Signed in as {admin.email} ({admin.role}).
      </p>

      <div className="mt-8 grid gap-4 sm:grid-cols-2">
        <div className="rounded-2xl border border-charcoal/10 bg-ivory p-6">
          <p className="font-display text-lg text-charcoal">Packages</p>
          <p className="mt-1 text-sm text-charcoal/60">Edit pricing, credits and offers shown on /pricing.</p>
          <Button href="/admin/packages" variant="secondary" size="md" className="mt-4">
            Manage Packages
          </Button>
        </div>
        <div className="rounded-2xl border border-charcoal/10 bg-ivory p-6">
          <p className="font-display text-lg text-charcoal">Services</p>
          <p className="mt-1 text-sm text-charcoal/60">Edit class descriptions and images shown on /services.</p>
          <Button href="/admin/services" variant="secondary" size="md" className="mt-4">
            Manage Services
          </Button>
        </div>
      </div>

      <p className="mt-8 text-sm text-charcoal/45">
        Bookings, payments, calendar and customer management land in the next phase of this build.
      </p>
    </div>
  );
}
