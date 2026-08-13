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
import { EASE, usePointerCapability, usePrefersReducedMotion } from "@/lib/motion";

const DEPTH_SPRING = { stiffness: 120, damping: 20, mass: 0.6 };

export function Hero() {
  const ref = useRef<HTMLElement>(null);
  const enabled = usePointerCapability();
  const reduceMotion = usePrefersReducedMotion();

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
      className="relative flex min-h-screen items-end overflow-hidden bg-walnut"
    >
      <motion.div
        className="absolute inset-0"
        initial={{ scale: 1.03 }}
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
          {reduceMotion ? (
            <Image
              src={images.hero.src}
              alt={images.hero.alt}
              fill
              priority
              quality={92}
              sizes="100vw"
              className="object-cover"
            />
          ) : (
            <>
              {/* Instant, correctly-cropped placeholder while the matching
                  <source> below loads — a single `poster` attribute can't
                  vary by breakpoint, so this is done as two CSS-media-gated
                  background layers instead (resolved identically on the
                  server and the client, unlike a JS viewport check, so
                  there's no hydration mismatch to cause a flash). */}
              <div
                aria-hidden
                className="absolute inset-0 h-full w-full bg-cover bg-center sm:hidden"
                style={{ backgroundImage: "url(/videos/hero-poster-mobile.webp)" }}
              />
              <div
                aria-hidden
                className="absolute inset-0 hidden h-full w-full bg-cover bg-center sm:block"
                style={{ backgroundImage: "url(/videos/hero-poster.webp)" }}
              />
              <video
                autoPlay
                muted
                loop
                playsInline
                preload="metadata"
                aria-hidden
                className="relative h-full w-full object-cover"
              >
                {/* Below the sm breakpoint (640px): a version cropped
                    in-file to a phone-friendly portrait aspect and re-encoded
                    at a fraction of the size — object-cover on the full
                    landscape source left mobile viewers seeing mostly the
                    gap of window between the two women (see the crop math
                    that led here), not a bandwidth problem CSS alone could fix. */}
                <source src="/videos/hero-loop-mobile.mp4" media="(max-width: 639px)" type="video/mp4" />
                <source src="/videos/hero-loop.mp4" type="video/mp4" />
              </video>
            </>
          )}
        </motion.div>
        <div className="absolute inset-0 bg-gradient-to-t from-walnut via-walnut/30 to-charcoal/10" />
        <div className="absolute inset-0 bg-gradient-to-r from-walnut/55 via-transparent to-transparent" />
        {/* Independent top vignette so the floating nav stays legible regardless
            of the bottom-focused gradient above or what the video shows at any
            given frame. */}
        <div className="absolute inset-x-0 top-0 h-40 bg-gradient-to-b from-charcoal/55 to-transparent sm:h-56" />
      </motion.div>

      <StaggerContainer className="relative z-10 mx-auto w-full max-w-7xl px-6 pb-14 sm:px-8 sm:pb-16 lg:px-12 lg:pb-20">
        <div className="max-w-6xl">
          <StaggerItem>
            <p className="text-[10px] font-medium uppercase tracking-[0.26em] text-ivory/70 sm:text-xs sm:tracking-[0.3em]">
            {siteConfig.name} · Bacoor, Cavite
            </p>
          </StaggerItem>
          <RevealHeading
            lines={["Move with intention.", "Feel your best."]}
            className="font-display mt-4 max-w-6xl text-[clamp(2.9rem,5.8vw,6rem)] font-medium leading-[0.9] tracking-[-0.025em] text-ivory [&>span>span]:lg:whitespace-nowrap"
          />
          <StaggerItem>
            <p className="mt-6 max-w-xl text-sm leading-relaxed text-ivory/78 sm:text-base lg:text-lg">
              Pilates, yoga and barre—thoughtfully guided in one boutique wellness studio in Bacoor, Cavite.
            </p>
          </StaggerItem>
          <StaggerItem>
            <div className="mt-7 flex flex-wrap items-center gap-x-5 gap-y-3">
              <Button href="/book" size="lg" magnetic>
                {siteConfig.bookingCtaLabel}
              </Button>
              <Button
                href="/services"
                variant="ghost"
                className="text-ivory/80 hover:text-ivory"
              >
                Explore Classes
              </Button>
            </div>
          </StaggerItem>
          <StaggerItem>
            <div className="mt-7 flex items-center gap-2 text-ivory/60">
              <MapPin size={14} aria-hidden />
              <p className="text-[10px] uppercase tracking-[0.18em] sm:text-xs">Opening soon</p>
            </div>
          </StaggerItem>
        </div>
      </StaggerContainer>
    </section>
  );
}
