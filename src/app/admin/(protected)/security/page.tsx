import type { Metadata } from "next";
import { requireAdmin } from "@/lib/auth/require-role";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { isAdminMfaRequired } from "@/lib/feature-flags";
import { maskPhone } from "@/lib/phone";
import { Button } from "@/components/ui/Button";
import { DisconnectMfaButton } from "@/components/admin/DisconnectMfaButton";
import { ChangeEmailForm } from "@/components/account/ChangeEmailForm";
import { ChangePasswordForm } from "@/components/account/ChangePasswordForm";

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
  const verifiedTotp = (factorsData?.totp ?? []).find((f) => f.status === "verified");
  const verifiedPhone = (factorsData?.phone ?? []).find((f) => f.status === "verified");
  const hasAnyMfa = !!verifiedTotp || !!verifiedPhone;

  return (
    <div>
      <h1 className="font-display text-2xl text-charcoal">Security</h1>
      <p className="mt-2 text-charcoal/60">
        Admin MFA is currently {isAdminMfaRequired() ? "required" : "optional"} for this project.
        {!hasAnyMfa && " We recommend enabling it, especially for super admin accounts."}
      </p>

      <div className="mt-8 grid max-w-2xl gap-6 sm:grid-cols-2">
        <div className="rounded-2xl border border-charcoal/10 bg-ivory p-6">
          <p className="text-xs uppercase tracking-[0.14em] text-charcoal/45">Authenticator App</p>
          <p className="mt-2 text-lg text-charcoal">{verifiedTotp ? "Enabled" : "Not Enabled"}</p>
          <p className="mt-1 text-sm text-charcoal/60">
            {verifiedTotp ? "Google Authenticator or similar." : "Works today — no SMS provider needed."}
          </p>
          {verifiedTotp ? (
            <DisconnectMfaButton factorId={verifiedTotp.id} />
          ) : (
            <Button href="/admin/mfa" variant="secondary" size="md" className="mt-4">
              Set Up
            </Button>
          )}
        </div>

        <div className="rounded-2xl border border-charcoal/10 bg-ivory p-6">
          <p className="text-xs uppercase tracking-[0.14em] text-charcoal/45">Phone MFA</p>
          <p className="mt-2 text-lg text-charcoal">{verifiedPhone ? "Enabled" : "Not Enabled"}</p>
          {verifiedPhone && profile?.mobile_number ? (
            <p className="mt-1 text-sm text-charcoal/60">Phone: {maskPhone(profile.mobile_number)}</p>
          ) : (
            <p className="mt-1 text-sm text-charcoal/60">Requires an SMS provider configured in Supabase.</p>
          )}
          {verifiedPhone ? (
            <DisconnectMfaButton factorId={verifiedPhone.id} />
          ) : (
            <Button href="/admin/mfa" variant="secondary" size="md" className="mt-4">
              Set Up
            </Button>
          )}
        </div>
      </div>

      <div className="mt-10 max-w-lg">
        <p className="text-xs uppercase tracking-[0.14em] text-charcoal/45">Email Address</p>
        <div className="mt-4">
          <ChangeEmailForm currentEmail={admin.email} />
        </div>
      </div>

      <div className="mt-10 max-w-lg">
        <p className="text-xs uppercase tracking-[0.14em] text-charcoal/45">Password</p>
        <div className="mt-4">
          <ChangePasswordForm />
        </div>
      </div>
    </div>
  );
}
