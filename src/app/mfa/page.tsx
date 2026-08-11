import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { requireUser } from "@/lib/auth/require-role";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { sanitizeRedirectTo } from "@/lib/utils";
import { MfaStepUpForm } from "@/components/auth/MfaStepUpForm";

export const metadata: Metadata = {
  title: "Verify Identity",
  robots: { index: false, follow: false },
};

type MfaPageProps = {
  searchParams: Promise<{ redirectTo?: string }>;
};

export default async function MfaPage({ searchParams }: MfaPageProps) {
  await requireUser();
  const params = await searchParams;
  const redirectTo = sanitizeRedirectTo(params.redirectTo, "/account/security");
  const supabase = await createSupabaseServerClient();
  const { data: assurance } = await supabase.auth.mfa.getAuthenticatorAssuranceLevel();

  if (assurance?.currentLevel === "aal2") redirect(redirectTo);

  const { data } = await supabase.auth.mfa.listFactors();
  const factors = (data?.all ?? [])
    .filter((factor) => factor.status === "verified")
    .map((factor) => ({
      id: factor.id,
      type: factor.factor_type as "totp" | "phone",
      label: factor.factor_type === "phone" ? "Send a code by SMS" : "Use authenticator app",
    }));

  if (factors.length === 0) redirect(redirectTo);

  return (
    <main className="flex min-h-screen items-center justify-center bg-charcoal px-6 py-16">
      <div className="w-full max-w-sm rounded-2xl border border-ivory/10 bg-ivory p-8">
        <MfaStepUpForm factors={factors} redirectTo={redirectTo} />
      </div>
    </main>
  );
}
