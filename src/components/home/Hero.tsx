"use client";

import Image from "next/image";
import { motion } from "framer-motion";
import { siteConfig } from "@/data/site";
import { images } from "@/data/images";
import { Button } from "@/components/ui/Button";
import { StaggerContainer, StaggerItem } from "@/components/ui/AnimatedSection";

const EASE = [0.16, 1, 0.3, 1] as const;

export function Hero() {
  return (
    <section className="relative flex min-h-[92vh] items-end overflow-hidden bg-charcoal">
      <motion.div
        className="absolute inset-0"
        initial={{ scale: 1.12 }}
        animate={{ scale: 1 }}
        transition={{ duration: 1.8, ease: EASE }}
      >
        <Image
          src={images.hero.src}
          alt={images.hero.alt}
          fill
          priority
          sizes="100vw"
          className="object-cover"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-charcoal via-charcoal/30 to-charcoal/10" />
      </motion.div>

      <StaggerContainer className="relative z-10 mx-auto w-full max-w-7xl px-6 pb-20 pt-40 sm:px-8 sm:pb-24 lg:px-12">
        <StaggerItem>
          <p className="text-xs font-medium uppercase tracking-[0.3em] text-ivory/70">
            {siteConfig.name}
          </p>
        </StaggerItem>
        <StaggerItem>
          <h1 className="font-display balance mt-6 max-w-4xl text-5xl leading-[1.05] text-ivory sm:text-6xl md:text-7xl">
            Move with intention.
            <br />
            Feel like yourself.
          </h1>
        </StaggerItem>
        <StaggerItem>
          <p className="mt-8 max-w-xl text-base leading-relaxed text-ivory/80 sm:text-lg">
            {siteConfig.shortName} Movement &amp; Wellness is a thoughtfully designed space for
            strength, mobility, restoration and mindful movement.
          </p>
        </StaggerItem>
        <StaggerItem>
          <div className="mt-10 flex flex-wrap items-center gap-4">
            <Button href="/book" size="lg">
              {siteConfig.bookingCtaLabel}
            </Button>
            <Button href="/services" size="lg" variant="secondary" className="border-ivory/40 text-ivory hover:border-ivory">
              Explore Services
            </Button>
          </div>
        </StaggerItem>
      </StaggerContainer>
    </section>
  );
}
