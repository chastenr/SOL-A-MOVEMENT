import type { Metadata } from "next";
import { MapPin, Phone, Mail, Clock } from "lucide-react";
import { siteConfig } from "@/data/site";
import { AnimatedSection } from "@/components/ui/AnimatedSection";
import { SectionHeading } from "@/components/ui/SectionHeading";
import { ContactForm } from "@/components/contact/ContactForm";

export const metadata: Metadata = {
  title: "Contact",
  description: "Get in touch with SOLÉA Movement & Wellness — studio address, hours and contact form.",
  alternates: { canonical: "/contact" },
};

export default function ContactPage() {
  return (
    <section className="mx-auto max-w-7xl px-6 pt-40 pb-24 sm:px-8 sm:pb-32 lg:px-12">
      <AnimatedSection>
        <SectionHeading
          eyebrow="Get in Touch"
          heading="We would love to hear from you."
          body="Questions about a service, your booking, or SOLÉA in general? Send us a message and we'll get back to you soon."
        />
      </AnimatedSection>

      <div className="mt-16 grid gap-16 lg:grid-cols-[1fr_1.4fr] lg:gap-24">
        <AnimatedSection className="space-y-8">
          <InfoRow icon={MapPin} label="Studio Address">
            <p>{siteConfig.contact.address.line1}</p>
            <p>{siteConfig.contact.address.line2}</p>
          </InfoRow>
          <InfoRow icon={Phone} label="Phone">
            <p>{siteConfig.contact.phone}</p>
          </InfoRow>
          <InfoRow icon={Mail} label="Email">
            <p>{siteConfig.contact.email}</p>
          </InfoRow>
          <InfoRow icon={Clock} label="Hours">
            <dl className="space-y-1">
              {siteConfig.hours.map((entry) => (
                <div key={entry.day} className="flex justify-between gap-6 text-sm">
                  <dt className="text-charcoal/60">{entry.day}</dt>
                  <dd>{entry.hours}</dd>
                </div>
              ))}
            </dl>
          </InfoRow>
        </AnimatedSection>

        <AnimatedSection delay={0.1}>
          <ContactForm />
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
        <p className="text-xs uppercase tracking-[0.14em] text-charcoal/45">{label}</p>
        <div className="mt-1 text-charcoal">{children}</div>
      </div>
    </div>
  );
}
