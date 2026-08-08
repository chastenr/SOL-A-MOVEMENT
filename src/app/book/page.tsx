import type { Metadata } from "next";
import { getServiceBySlug } from "@/data/services";
import { siteConfig } from "@/data/site";
import { BookingFlow } from "@/components/booking/BookingFlow";

export const metadata: Metadata = {
  title: siteConfig.bookingCtaLabel,
  description:
    "Book your Reformer Pilates, Mat Pilates, Yoga Flow, Mobility & Stretch, Private or Wellness session at SOLÉA Movement & Wellness.",
  alternates: { canonical: "/book" },
};

type BookPageProps = {
  searchParams: Promise<{ service?: string; date?: string; time?: string }>;
};

function isValidDate(value?: string) {
  if (!value) return false;
  return /^\d{4}-\d{2}-\d{2}$/.test(value) && !Number.isNaN(new Date(`${value}T00:00:00`).getTime());
}

export default async function BookPage({ searchParams }: BookPageProps) {
  const params = await searchParams;
  const service = getServiceBySlug(params.service ?? "")?.slug;
  const date = isValidDate(params.date) ? params.date : undefined;
  const time = date && params.time ? params.time : undefined;

  return (
    <section className="mx-auto max-w-5xl px-6 pt-36 pb-24 sm:px-8 sm:pb-32 lg:px-12">
      <BookingFlow initialService={service} initialDate={date} initialTime={time} />
    </section>
  );
}
