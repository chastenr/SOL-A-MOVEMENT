import type { Metadata } from "next";
import Link from "next/link";
import { AnimatedSection } from "@/components/ui/AnimatedSection";
import { SectionHeading } from "@/components/ui/SectionHeading";
import { LoginForm } from "@/components/auth/LoginForm";

export const metadata: Metadata = {
  title: "Sign In",
  description: "Sign in to your Veora Wellness account.",
  alternates: { canonical: "/login" },
};

type LoginPageProps = {
  searchParams: Promise<{ redirectTo?: string }>;
};

export default async function LoginPage({ searchParams }: LoginPageProps) {
  const params = await searchParams;
  const signUpHref = params.redirectTo
    ? `/signup?redirectTo=${encodeURIComponent(params.redirectTo)}`
    : "/signup";

  return (
    <section className="mx-auto max-w-md px-6 pt-40 pb-16 sm:px-8 sm:pb-20">
      <AnimatedSection>
        <SectionHeading eyebrow="Welcome Back" heading="Sign in to your account." align="center" className="mx-auto" />
      </AnimatedSection>

      <AnimatedSection delay={0.1} className="mt-10">
        <LoginForm redirectTo={params.redirectTo} />
      </AnimatedSection>

      <p className="mt-8 text-center text-sm text-charcoal/60">
        New to Veora?{" "}
        <Link href={signUpHref} className="underline underline-offset-2 hover:text-charcoal">
          Create an account
        </Link>
      </p>
    </section>
  );
}
