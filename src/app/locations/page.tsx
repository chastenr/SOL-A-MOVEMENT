import type { Metadata } from "next";
import { MapPin, Phone, Mail, Clock, ExternalLink } from "lucide-react";
import { getActiveLocations } from "@/data/locations";
import { AnimatedSection } from "@/components/ui/AnimatedSection";
import { SectionHeading } from "@/components/ui/SectionHeading";
import { Button } from "@/components/ui/Button";
import { TiltCard } from "@/components/ui/TiltCard";

export const metadata: Metadata = {
  title: "Locations",
  description: "Find Veora Wellness — studio address, contact details and directions.",
  alternates: { canonical: "/locations" },
};

export default function LocationsPage() {
  const locations = getActiveLocations();

  return (
    <section className="mx-auto max-w-7xl px-6 pt-40 pb-24 sm:px-8 sm:pb-32 lg:px-12">
      <AnimatedSection>
        <SectionHeading
          eyebrow="Visit Us"
          heading="Your wellness journey starts here."
          body={
            locations.length > 1
              ? "Find the Veora studio nearest you."
              : "Veora currently operates from a single studio — more locations are on the way."
          }
        />
      </AnimatedSection>

      <div className="mt-14 grid gap-8 sm:grid-cols-2">
        {locations.map((location, index) => (
          <AnimatedSection key={location.slug} delay={Math.min(index * 0.08, 0.3)}>
            <TiltCard maxTilt={2} className="rounded-2xl border border-charcoal/10 bg-ivory p-8">
              <p className="font-display text-2xl text-charcoal">{location.name}</p>

              <div className="mt-6 space-y-4 text-sm text-charcoal/70">
                <div className="flex gap-3">
                  <MapPin size={18} className="mt-0.5 shrink-0 text-clay" aria-hidden />
                  <div>
                    <p>{location.address.line1}</p>
                    <p>{location.address.line2}</p>
                  </div>
                </div>
                <div className="flex gap-3">
                  <Phone size={18} className="mt-0.5 shrink-0 text-clay" aria-hidden />
                  <p>{location.phone}</p>
                </div>
                <div className="flex gap-3">
                  <Mail size={18} className="mt-0.5 shrink-0 text-clay" aria-hidden />
                  <p>{location.email}</p>
                </div>
                <div className="flex gap-3">
                  <Clock size={18} className="mt-0.5 shrink-0 text-clay" aria-hidden />
                  <p>{location.hoursNote}</p>
                </div>
              </div>

              <div className="mt-8 flex flex-wrap gap-3">
                <Button href="/book" size="md">
                  Book a Session
                </Button>
                <Button href={location.mapUrl} target="_blank" rel="noreferrer noopener" size="md" variant="secondary">
                  Get Directions
                  <ExternalLink size={14} aria-hidden />
                </Button>
              </div>
            </TiltCard>
          </AnimatedSection>
        ))}
      </div>
    </section>
  );
}
