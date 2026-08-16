import { createPageMetadata } from "@/lib/seo-metadata";
import Link from "next/link";
import { MapPin, Phone, Mail, Clock } from "lucide-react";
import { siteConfig } from "@/data/site";
import { AnimatedSection } from "@/components/ui/AnimatedSection";
import { SectionHeading } from "@/components/ui/SectionHeading";
import { ContactForm } from "@/components/contact/ContactForm";

export const metadata = createPageMetadata({
  title: "Contact Our Bacoor Wellness Studio",
  description: "Contact Veora Wellness for class, package or studio questions. Find our Bacoor address, daily opening hours, Philippine phone number and booking email.",
  path: "/contact",
});

type ContactPageProps = {
  searchParams: Promise<{ topic?: string }>;
};

export default async function ContactPage({ searchParams }: ContactPageProps) {
  const params = await searchParams;

  return (
    <section className="mx-auto max-w-7xl px-6 pt-40 pb-16 sm:px-8 sm:pb-20 lg:px-12">
      <AnimatedSection>
        <SectionHeading
          as="h1"
          eyebrow="Get in Touch"
          heading="We would love to hear from you."
          body="Questions about a service, your booking, or Veora in general? Send us a message and we'll get back to you soon."
        />
      </AnimatedSection>

      <div className="mt-16 grid gap-16 lg:grid-cols-[1fr_1.4fr] lg:gap-24">
        <AnimatedSection className="space-y-8">
          <InfoRow icon={MapPin} label="Studio Address">
            <p>{siteConfig.contact.address.line1}</p>
            <p>{siteConfig.contact.address.line2}</p>
          </InfoRow>
          <InfoRow icon={Phone} label="Phone">
            <a href={`tel:${siteConfig.contact.phone.replace(/\s/g, "")}`} className="hover:text-clay">{siteConfig.contact.phone}</a>
          </InfoRow>
          <InfoRow icon={Mail} label="Email">
            <a href={`mailto:${siteConfig.contact.email}`} className="hover:text-clay">{siteConfig.contact.email}</a>
          </InfoRow>
          <InfoRow icon={Clock} label="Hours">
            {siteConfig.hours.length > 0 ? (
              <dl className="space-y-1">
                {siteConfig.hours.map((entry) => (
                  <div key={entry.day} className="flex justify-between gap-6 text-base leading-relaxed">
                    <dt className="text-charcoal/60">{entry.day}</dt>
                    <dd>{entry.hours}</dd>
                  </div>
                ))}
              </dl>
            ) : (
              <p className="text-base leading-relaxed text-charcoal/75">{siteConfig.hoursNote}</p>
            )}
          </InfoRow>

          <p className="text-base leading-relaxed text-charcoal/75">
            Have a quick question?{" "}
            <Link href="/faq" className="underline underline-offset-2 hover:text-charcoal">
              Check our FAQ
            </Link>{" "}
            before reaching out.
          </p>
        </AnimatedSection>

        <AnimatedSection delay={0.1}>
          <ContactForm initialTopic={params.topic} />
        </AnimatedSection>
      </div>
    </section>
  );
}

function InfoRow({
  icon: Icon,
  label,
  children,
}: {
  icon: typeof MapPin;
  label: string;
  children: React.ReactNode;
}) {
  return (
    <div className="flex gap-4">
      <span className="mt-1 flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-cream text-clay">
        <Icon size={18} aria-hidden />
      </span>
      <div>
        <p className="text-xs font-semibold uppercase tracking-[0.14em] text-charcoal/70">{label}</p>
        <div className="mt-1 text-charcoal">{children}</div>
      </div>
    </div>
  );
}
