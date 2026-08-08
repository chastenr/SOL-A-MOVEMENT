import Image from "next/image";
import { images } from "@/data/images";
import { AnimatedSection } from "@/components/ui/AnimatedSection";
import { Button } from "@/components/ui/Button";

export function BookingCta() {
  return (
    <section className="relative isolate overflow-hidden bg-charcoal py-28 sm:py-36">
      <Image
        src={images.bookingCta.src}
        alt={images.bookingCta.alt}
        fill
        sizes="100vw"
        className="object-cover opacity-30"
      />
      <div className="absolute inset-0 bg-gradient-to-b from-charcoal via-charcoal/80 to-charcoal" />

      <AnimatedSection className="relative z-10 mx-auto max-w-3xl px-6 text-center sm:px-8">
        <p className="text-xs font-medium uppercase tracking-[0.3em] text-clay">
          Ready to move?
        </p>
        <h2 className="font-display balance mt-6 text-4xl leading-tight text-ivory sm:text-5xl md:text-6xl">
          Choose your session, find your time, reserve your visit.
        </h2>
        <p className="mt-6 text-base leading-relaxed text-ivory/75 sm:text-lg">
          Choose your session, find a time that works for you, and reserve your visit to Veora.
        </p>
        <div className="mt-10 flex justify-center">
          <Button href="/book" size="lg">
            Book Your Session
          </Button>
        </div>
      </AnimatedSection>
    </section>
  );
}
