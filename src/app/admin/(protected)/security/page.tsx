import type { Metadata } from "next";
import { requireAdmin } from "@/lib/auth/require-role";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { isAdminMfaRequired } from "@/lib/feature-flags";
import { maskPhone } from "@/lib/phone";
import { Button } from "@/components/ui/Button";

export const metadata: Metadata = {
  title: "Security",
  robots: { index: false, follow: false },
};

export default async function AdminSecurityPage() {
  const admin = await requireAdmin();

  const supabase = await createSupabaseServerClient();
  const [{ data: factorsData }, { data: profile }] = await Promise.all([
    supabase.auth.mfa.listFactors(),
    supabase.from("profiles").select("mobile_number").eq("id", admin.id).single(),
  ]);
  const isPhoneMfaEnabled = (factorsData?.phone ?? []).some((f) => f.status === "verified");

  return (
    <div>
      <h1 className="font-display text-2xl text-charcoal">Security</h1>
      <p className="mt-2 text-charcoal/60">
        Admin MFA is currently {isAdminMfaRequired() ? "required" : "optional"} for this project.
      </p>

      <div className="mt-8 max-w-md rounded-2xl border border-charcoal/10 bg-ivory p-6">
        <p className="text-xs uppercase tracking-[0.14em] text-charcoal/45">Phone MFA</p>
        <p className="mt-2 text-lg text-charcoal">{isPhoneMfaEnabled ? "Enabled" : "Not Enabled"}</p>
        {isPhoneMfaEnabled && profile?.mobile_number && (
          <p className="mt-1 text-sm text-charcoal/60">Phone: {maskPhone(profile.mobile_number)}</p>
        )}
        <Button href="/admin/mfa" variant="secondary" size="md" className="mt-4">
          {isPhoneMfaEnabled ? "Manage" : "Enroll Phone MFA"}
        </Button>
      </div>
    </div>
  );
}
