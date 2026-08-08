import Image from "next/image";
import { images } from "@/data/images";
import { AnimatedSection } from "@/components/ui/AnimatedSection";
import { ArchDivider } from "@/components/ui/ArchDivider";
import { Button } from "@/components/ui/Button";

export function BookingCta() {
  return (
    <section className="relative isolate overflow-hidden bg-walnut py-20 sm:py-28">
      <div className="absolute inset-x-0 top-0 z-10 text-plaster">
        <ArchDivider />
      </div>
      <Image
        src={images.bookingCta.src}
        alt={images.bookingCta.alt}
        fill
        sizes="100vw"
        className="object-cover opacity-35"
      />
      <div className="absolute inset-0 bg-gradient-to-b from-walnut/90 via-walnut/60 to-walnut/90" />

      <AnimatedSection className="relative z-10 mx-auto max-w-3xl px-6 text-center sm:px-8">
        <p className="text-xs font-medium uppercase tracking-[0.3em] text-clay">
          Ready to move?
        </p>
        <h2 className="font-display balance mt-5 text-4xl leading-tight text-ivory sm:text-5xl">
          Choose your session, find your time, reserve your visit.
        </h2>
        <p className="mt-5 text-base leading-relaxed text-ivory/75 sm:text-lg">
          Choose your session, find a time that works for you, and reserve your visit to Veora.
        </p>
        <div className="mt-8 flex justify-center">
          <Button href="/book" size="lg">
            Book Your Session
          </Button>
        </div>
      </AnimatedSection>
    </section>
  );
}
