import type { Metadata } from "next";
import Link from "next/link";
import { AnimatedSection } from "@/components/ui/AnimatedSection";
import { SectionHeading } from "@/components/ui/SectionHeading";
import { SignUpForm } from "@/components/auth/SignUpForm";

export const metadata: Metadata = {
  title: "Create Account",
  description: "Create a Veora Wellness account to buy class packages and book classes.",
  alternates: { canonical: "/signup" },
};

export default function SignUpPage() {
  return (
    <section className="mx-auto max-w-2xl px-6 pt-28 pb-16 sm:px-8 sm:pb-20">
      <AnimatedSection>
        <SectionHeading
          eyebrow="Create Account"
          heading="Join Veora Wellness."
          body="Create an account to buy class packages and book your sessions."
        />
      </AnimatedSection>

      <AnimatedSection delay={0.1} className="mt-10">
        <SignUpForm />
      </AnimatedSection>

      <p className="mt-8 text-center text-sm text-charcoal/60">
        Already have an account?{" "}
        <Link href="/login" className="underline underline-offset-2 hover:text-charcoal">
          Sign in
        </Link>
      </p>
    </section>
  );
}
