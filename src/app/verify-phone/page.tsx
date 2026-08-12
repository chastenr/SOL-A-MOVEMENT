import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { requireUser } from "@/lib/auth/require-role";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { sanitizeRedirectTo } from "@/lib/utils";
import { AnimatedSection } from "@/components/ui/AnimatedSection";
import { PhoneMfaFlow } from "@/components/auth/PhoneMfaFlow";

export const metadata: Metadata = {
  title: "Verify Your Mobile Number",
  robots: { index: false, follow: false },
};

type VerifyPhonePageProps = {
  searchParams: Promise<{ redirectTo?: string }>;
};

export default async function VerifyPhonePage({ searchParams }: VerifyPhonePageProps) {
  const user = await requireUser();
  const params = await searchParams;
  const redirectTo = sanitizeRedirectTo(params.redirectTo, "/account");

  const supabase = await createSupabaseServerClient();
  const { data: profile } = await supabase
    .from("profiles")
    .select("mobile_number, phone_verified_at")
    .eq("id", user.id)
    .single();

  if (profile?.phone_verified_at) {
    redirect(redirectTo);
  }

  return (
    <section className="mx-auto max-w-md px-6 pt-40 pb-16 sm:px-8 sm:pb-20">
      <AnimatedSection>
        <PhoneMfaFlow initialPhone={profile?.mobile_number ?? ""} redirectTo={redirectTo} />
      </AnimatedSection>
    </section>
  );
}
