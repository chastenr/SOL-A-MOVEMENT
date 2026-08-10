import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { getServices } from "@/lib/catalog/services";
import { getPricingOptionBySlug } from "@/lib/catalog/packages";
import { siteConfig } from "@/data/site";
import { getAuthedUser } from "@/lib/auth/require-role";
import { BookingFlow } from "@/components/booking/BookingFlow";

export const metadata: Metadata = {
  title: siteConfig.bookingCtaLabel,
  description:
    "Book your Mat Pilates, Yoga, Barre, Strength & HIIT, Recovery & Restore or Ballet class at Veora Wellness.",
  alternates: { canonical: "/book" },
};

type BookPageProps = {
  searchParams: Promise<{ service?: string; date?: string; time?: string; package?: string }>;
};

function isValidDate(value?: string) {
  if (!value) return false;
  return /^\d{4}-\d{2}-\d{2}$/.test(value) && !Number.isNaN(new Date(`${value}T00:00:00`).getTime());
}

/**
 * /book is the anonymous inquiry flow (no account, no credits, no login
 * needed) — for a visitor who already has an account and real package
 * credits, that's the wrong form entirely: it asks them to retype their
 * name/email/phone from scratch and doesn't touch their credits at all.
 * Every "Book a Session" button on the site links here regardless of auth
 * state, so the fix lives at the destination, not at each link: a signed-in
 * visitor is bounced straight to their real booking page before this form
 * ever renders. A signed-out visitor sees no change at all.
 */
export default async function BookPage({ searchParams }: BookPageProps) {
  const user = await getAuthedUser();
  if (user) redirect("/account/book");

  const params = await searchParams;
  const [services, pricingOption] = await Promise.all([
    getServices(),
    getPricingOptionBySlug(params.package ?? ""),
  ]);
  const service = services.find(
    (s) => s.slug === (params.service ?? pricingOption?.serviceSlug ?? "")
  )?.slug;
  const date = isValidDate(params.date) ? params.date : undefined;
  const time = date && params.time ? params.time : undefined;

  return (
    <section className="mx-auto max-w-5xl px-6 pt-28 pb-16 sm:px-8 sm:pb-20 lg:px-12">
      <BookingFlow
        services={services}
        initialService={service}
        initialDate={date}
        initialTime={time}
        initialPackageName={pricingOption?.name}
      />
    </section>
  );
}
