import type { Metadata } from "next";
import { requireAdmin } from "@/lib/auth/require-role";
import { CoachForm } from "@/components/admin/CoachForm";

export const metadata: Metadata = {
  title: "Add Coach",
  robots: { index: false, follow: false },
};

export default async function NewCoachPage() {
  await requireAdmin();
  return (
    <div>
      <h1 className="font-display text-2xl text-charcoal">Add Coach</h1>
      <div className="mt-6">
        <CoachForm />
      </div>
    </div>
  );
}
