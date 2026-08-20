import type { Metadata } from "next";
import { requireUser } from "@/lib/auth/require-role";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { maskPhone } from "@/lib/phone";
import { SectionHeading } from "@/components/ui/SectionHeading";
import { Button } from "@/components/ui/Button";
import { ChangePasswordForm } from "@/components/account/ChangePasswordForm";
import { ChangeEmailForm } from "@/components/account/ChangeEmailForm";

export const metadata: Metadata = {
  title: "Security",
  robots: { index: false, follow: false },
};

export default async function AccountSecurityPage() {
  const user = await requireUser();
  const supabase = await createSupabaseServerClient();
  const { data: profile } = await supabase
    .from("profiles")
    .select("mobile_number, phone_verified_at")
    .eq("id", user.id)
    .single();

  return (
    <div>
      <SectionHeading eyebrow="Security" heading="Account security." />

      <div className="mt-8 max-w-lg rounded-2xl border border-charcoal/10 bg-ivory p-6">
        <p className="text-xs uppercase tracking-[0.14em] text-charcoal/45">Mobile Number</p>
        <p className="mt-2 text-lg text-charcoal">
          {profile?.phone_verified_at ? "Verified" : "Not Verified"}
        </p>
        {profile?.mobile_number && (
          <p className="mt-1 text-sm text-charcoal/60">{maskPhone(profile.mobile_number)}</p>
        )}
        {!profile?.phone_verified_at && (
          <Button href="/verify-phone?redirectTo=/account/security" variant="secondary" size="md" className="mt-4">
            Verify Number
          </Button>
        )}
      </div>

      <div className="mt-8 max-w-lg">
        <p className="text-xs uppercase tracking-[0.14em] text-charcoal/45">Email Address</p>
        <div className="mt-4">
          <ChangeEmailForm currentEmail={user.email} />
        </div>
      </div>

      <div className="mt-8 max-w-lg">
        <p className="text-xs uppercase tracking-[0.14em] text-charcoal/45">Password</p>
        <div className="mt-4">
          <ChangePasswordForm />
        </div>
      </div>
    </div>
  );
}
