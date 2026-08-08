import type { Metadata } from "next";
import { getServiceBySlug } from "@/data/services";
import { getPricingOptionBySlug } from "@/data/pricing";
import { siteConfig } from "@/data/site";
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

export default async function BookPage({ searchParams }: BookPageProps) {
  const params = await searchParams;
  const pricingOption = getPricingOptionBySlug(params.package ?? "");
  const service = getServiceBySlug(params.service ?? pricingOption?.serviceSlug ?? "")?.slug;
  const date = isValidDate(params.date) ? params.date : undefined;
  const time = date && params.time ? params.time : undefined;

  return (
    <section className="mx-auto max-w-5xl px-6 pt-28 pb-16 sm:px-8 sm:pb-20 lg:px-12">
      <BookingFlow
        initialService={service}
        initialDate={date}
        initialTime={time}
        initialPackageName={pricingOption?.name}
      />
    </section>
  );
}
