import type { Metadata } from "next";
import { AnimatedSection } from "@/components/ui/AnimatedSection";
import { SectionHeading } from "@/components/ui/SectionHeading";
import { ResetPasswordForm } from "@/components/auth/ResetPasswordForm";
import { requireUser } from "@/lib/auth/require-role";

export const metadata: Metadata = {
  title: "Reset Password",
  description: "Set a new password for your Veora Wellness account.",
  alternates: { canonical: "/reset-password" },
};

type ResetPasswordPageProps = {
  searchParams: Promise<{ next?: string }>;
};

export default async function ResetPasswordPage({ searchParams }: ResetPasswordPageProps) {
  await requireUser();
  const params = await searchParams;

  return (
    <section className="mx-auto max-w-md px-6 pt-40 pb-16 sm:px-8 sm:pb-20">
      <AnimatedSection>
        <SectionHeading eyebrow="Reset Password" heading="Choose a new password." align="center" className="mx-auto" />
      </AnimatedSection>

      <AnimatedSection delay={0.1} className="mt-10">
        <ResetPasswordForm redirectTo={params.next} />
      </AnimatedSection>
    </section>
  );
}
