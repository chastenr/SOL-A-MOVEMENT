"use client";

import { useRef } from "react";
import Image from "next/image";
import { MapPin } from "lucide-react";
import { motion, useMotionValue, useSpring, useTransform } from "framer-motion";
import { siteConfig } from "@/data/site";
import { images } from "@/data/images";
import { Button } from "@/components/ui/Button";
import { RevealHeading } from "@/components/ui/RevealHeading";
import { StaggerContainer, StaggerItem } from "@/components/ui/AnimatedSection";
import { EASE, usePointerCapability } from "@/lib/motion";

const DEPTH_SPRING = { stiffness: 120, damping: 20, mass: 0.6 };

export function Hero() {
  const ref = useRef<HTMLElement>(null);
  const enabled = usePointerCapability();

  const pointerX = useMotionValue(0.5);
  const pointerY = useMotionValue(0.5);

  const rotateX = useSpring(useTransform(pointerY, [0, 1], [1.5, -1.5]), DEPTH_SPRING);
  const rotateY = useSpring(useTransform(pointerX, [0, 1], [-2, 2]), DEPTH_SPRING);
  const translateX = useSpring(useTransform(pointerX, [0, 1], [-6, 6]), DEPTH_SPRING);
  const translateY = useSpring(useTransform(pointerY, [0, 1], [-6, 6]), DEPTH_SPRING);

  function handleMouseMove(event: React.MouseEvent<HTMLElement>) {
    const rect = ref.current?.getBoundingClientRect();
    if (!rect) return;
    pointerX.set((event.clientX - rect.left) / rect.width);
    pointerY.set((event.clientY - rect.top) / rect.height);
  }

  function handleMouseLeave() {
    pointerX.set(0.5);
    pointerY.set(0.5);
  }

  return (
    <section
      ref={ref}
      onMouseMove={enabled ? handleMouseMove : undefined}
      onMouseLeave={enabled ? handleMouseLeave : undefined}
      className="relative flex min-h-[88vh] items-center overflow-hidden bg-charcoal"
    >
      <motion.div
        className="absolute inset-0"
        initial={{ scale: 1.12 }}
        animate={{ scale: 1 }}
        transition={{ duration: 1.8, ease: EASE }}
      >
        <motion.div
          className="absolute inset-[-2%]"
          style={
            enabled
              ? { rotateX, rotateY, x: translateX, y: translateY, transformPerspective: 1200 }
              : undefined
          }
        >
          <Image
            src={images.hero.src}
            alt={images.hero.alt}
            fill
            priority
            sizes="100vw"
            className="object-cover"
          />
        </motion.div>
        <div className="absolute inset-0 bg-gradient-to-t from-charcoal via-charcoal/25 to-charcoal/5" />
        <div className="absolute inset-0 bg-gradient-to-r from-charcoal/50 via-transparent to-transparent" />
      </motion.div>

      <StaggerContainer className="relative z-10 mx-auto w-full max-w-7xl px-6 py-28 sm:px-8 sm:py-32 lg:px-12">
        <StaggerItem>
          <p className="text-xs font-medium uppercase tracking-[0.3em] text-ivory/70">
            {siteConfig.name}
          </p>
        </StaggerItem>
        <RevealHeading
          lines={["Move with intention.", "Feel your best."]}
          className="font-display balance mt-5 max-w-4xl text-5xl leading-[1.05] text-ivory sm:text-6xl md:text-7xl"
        />
        <StaggerItem>
          <p className="mt-6 max-w-xl text-base leading-relaxed text-ivory/80 sm:text-lg">
            Explore Pilates, yoga, barre, strength and ballet, all in one welcoming studio in
            Bacoor, Cavite — designed to help you move with purpose and reconnect with your body.
          </p>
        </StaggerItem>
        <StaggerItem>
          <div className="mt-8 flex flex-wrap items-center gap-5">
            <Button href="/book" size="lg" magnetic>
              {siteConfig.bookingCtaLabel}
            </Button>
            <Button
              href="/services"
              variant="ghost"
              className="text-ivory/80 hover:text-ivory"
            >
              Explore Services
            </Button>
          </div>
        </StaggerItem>
        <StaggerItem>
          <div className="mt-8 flex items-center gap-2 text-ivory/60">
            <MapPin size={14} aria-hidden />
            <p className="text-xs uppercase tracking-[0.18em]">Opening soon in Bacoor, Cavite</p>
          </div>
        </StaggerItem>
      </StaggerContainer>
    </section>
  );
}
