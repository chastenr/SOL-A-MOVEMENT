import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { Check } from "lucide-react";
import { requireVerifiedCustomer } from "@/lib/auth/require-role";
import { getPackageRowBySlug } from "@/lib/catalog/packages";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { centavosToPeso } from "@/lib/money";
import { AnimatedSection } from "@/components/ui/AnimatedSection";
import { SectionHeading } from "@/components/ui/SectionHeading";
import { Button } from "@/components/ui/Button";
import { createPurchaseAction } from "./actions";

export const metadata: Metadata = {
  title: "Checkout",
  robots: { index: false, follow: false },
};

type CheckoutPageProps = {
  params: Promise<{ packageSlug: string }>;
  searchParams: Promise<{ error?: string }>;
};

export default async function CheckoutPage({ params, searchParams }: CheckoutPageProps) {
  const { packageSlug } = await params;
  const { error } = await searchParams;
  const user = await requireVerifiedCustomer(`/checkout/${packageSlug}`);

  const pkg = await getPackageRowBySlug(packageSlug);
  if (!pkg) notFound();

  const supabase = await createSupabaseServerClient();
  const { data: profile } = await supabase
    .from("profiles")
    .select("first_name, last_name, email, mobile_number")
    .eq("id", user.id)
    .single();

  return (
    <section className="mx-auto max-w-2xl px-6 pt-28 pb-16 sm:px-8 sm:pb-20">
      <AnimatedSection>
        <SectionHeading eyebrow="Checkout" heading={pkg.name} />
      </AnimatedSection>

      <AnimatedSection delay={0.1} className="mt-8 rounded-2xl border border-charcoal/10 bg-ivory p-6 sm:p-8">
        <div className="flex items-baseline justify-between">
          <p className="text-charcoal/60">Price</p>
          <p className="font-display text-3xl text-charcoal">{centavosToPeso(pkg.price_centavos)}</p>
        </div>
        <dl className="mt-4 space-y-2 border-t border-charcoal/10 pt-4 text-sm">
          {pkg.credit_count != null && (
            <div className="flex justify-between">
              <dt className="text-charcoal/55">Credits</dt>
              <dd className="text-charcoal">{pkg.credit_count}</dd>
            </div>
          )}
          <div className="flex justify-between">
            <dt className="text-charcoal/55">Validity</dt>
            <dd className="text-charcoal">{pkg.validity_description}</dd>
          </div>
        </dl>

        {pkg.included_services.length > 0 && (
          <ul className="mt-4 space-y-1.5 border-t border-charcoal/10 pt-4">
            {pkg.included_services.map((item) => (
              <li key={item} className="flex items-start gap-2 text-sm text-charcoal/65">
                <Check size={15} className="mt-0.5 shrink-0 text-clay" aria-hidden />
                <span>{item}</span>
              </li>
            ))}
          </ul>
        )}

        <div className="mt-6 space-y-1 border-t border-charcoal/10 pt-4 text-sm">
          <p className="text-xs uppercase tracking-[0.1em] text-charcoal/45">Customer</p>
          <p className="text-charcoal">
            {profile?.first_name} {profile?.last_name}
          </p>
          <p className="text-charcoal/60">{profile?.email}</p>
          <p className="text-charcoal/60">{profile?.mobile_number}</p>
        </div>

        <div className="mt-6 flex items-baseline justify-between border-t border-charcoal/10 pt-4">
          <p className="font-display text-lg text-charcoal">Total</p>
          <p className="font-display text-2xl text-charcoal">{centavosToPeso(pkg.price_centavos)}</p>
        </div>

        <p className="mt-4 text-xs text-charcoal/45">
          Payment method: Bank Transfer / QR — you&rsquo;ll see the details on the next step.
        </p>

        {error && (
          <p className="mt-4 text-sm text-red-600">
            Something went wrong creating your order. Please try again.
          </p>
        )}

        <form action={createPurchaseAction.bind(null, packageSlug)}>
          <Button type="submit" size="lg" className="mt-6 w-full">
            Proceed to Payment
          </Button>
        </form>
      </AnimatedSection>
    </section>
  );
}
