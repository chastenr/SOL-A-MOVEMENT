import type { Metadata } from "next";
import { AnimatedSection } from "@/components/ui/AnimatedSection";
import { SectionHeading } from "@/components/ui/SectionHeading";
import { ForgotPasswordForm } from "@/components/auth/ForgotPasswordForm";

export const metadata: Metadata = {
  title: "Forgot Password",
  description: "Reset your Veora Wellness account password.",
  alternates: { canonical: "/forgot-password" },
};

export default function ForgotPasswordPage() {
  return (
    <section className="mx-auto max-w-md px-6 pt-28 pb-16 sm:px-8 sm:pb-20">
      <AnimatedSection>
        <SectionHeading
          eyebrow="Reset Password"
          heading="Forgot your password?"
          body="Enter your email and we'll send you a link to reset it."
          align="center"
          className="mx-auto"
        />
      </AnimatedSection>

      <AnimatedSection delay={0.1} className="mt-10">
        <ForgotPasswordForm />
      </AnimatedSection>
    </section>
  );
}
