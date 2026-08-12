import type { Metadata } from "next";
import { AnimatedSection } from "@/components/ui/AnimatedSection";
import { SectionHeading } from "@/components/ui/SectionHeading";
import { ForgotPasswordForm } from "@/components/auth/ForgotPasswordForm";

export const metadata: Metadata = {
  title: "Forgot Password",
  description: "Reset your Veora Wellness account password.",
  alternates: { canonical: "/forgot-password" },
};

type ForgotPasswordPageProps = {
  searchParams: Promise<{ error?: string }>;
};

export default async function ForgotPasswordPage({ searchParams }: ForgotPasswordPageProps) {
  const params = await searchParams;

  return (
    <section className="mx-auto max-w-md px-6 pt-40 pb-16 sm:px-8 sm:pb-20">
      <AnimatedSection>
        <SectionHeading
          eyebrow="Reset Password"
          heading="Forgot your password?"
          body="Enter your email and we'll send you a link to reset it."
          align="center"
          className="mx-auto"
        />
      </AnimatedSection>

      {params.error === "invalid_or_expired_link" && (
        <p role="alert" className="mt-6 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-center text-sm text-red-700">
          That reset link is invalid or has expired. Request a new one below.
        </p>
      )}

      <AnimatedSection delay={0.1} className="mt-10">
        <ForgotPasswordForm />
      </AnimatedSection>
    </section>
  );
}
