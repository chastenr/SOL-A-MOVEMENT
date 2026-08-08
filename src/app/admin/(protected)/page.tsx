import type { Metadata } from "next";
import { requireAdmin } from "@/lib/auth/require-role";

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
        Signed in as {admin.email} ({admin.role}). Bookings, payments, packages and customer management land in
        upcoming batches of this build.
      </p>
    </div>
  );
}
