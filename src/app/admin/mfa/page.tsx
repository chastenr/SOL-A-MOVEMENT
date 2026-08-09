import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { getAuthedUser } from "@/lib/auth/require-role";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { AdminMfaChooser } from "@/components/auth/AdminMfaChooser";

export const metadata: Metadata = {
  title: "Admin Verification",
  robots: { index: false, follow: false },
};

// Deliberately NOT under admin/(protected) — that layout's requireAdmin()
// enforces AAL2, which is exactly what an admin arrives here to satisfy.
// This page only checks role, not assurance level, to avoid a redirect loop.
export default async function AdminMfaPage() {
  const user = await getAuthedUser();
  if (!user) redirect("/admin/login");
  if (user.role !== "admin" && user.role !== "super_admin") redirect("/");

  const supabase = await createSupabaseServerClient();
  const { data: mfaData } = await supabase.auth.mfa.getAuthenticatorAssuranceLevel();
  if (mfaData?.currentLevel === "aal2") {
    redirect("/admin");
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-charcoal px-6">
      <div className="w-full max-w-sm rounded-2xl border border-ivory/10 bg-ivory p-8">
        <AdminMfaChooser redirectTo="/admin" />
      </div>
    </div>
  );
}
