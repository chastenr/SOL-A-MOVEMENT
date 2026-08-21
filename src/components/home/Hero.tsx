"use client";

import { useEffect, useRef, useState } from "react";
import { MapPin } from "lucide-react";
import { motion, useMotionValue, useSpring, useTransform } from "framer-motion";
import { siteConfig } from "@/data/site";
import { Button } from "@/components/ui/Button";
import { EASE, usePointerCapability, usePrefersReducedMotion } from "@/lib/motion";

const DEPTH_SPRING = { stiffness: 120, damping: 20, mass: 0.6 };

export function Hero() {
  const ref = useRef<HTMLElement>(null);
  const enabled = usePointerCapability();
  const reduceMotion = usePrefersReducedMotion();
  const [playVideo, setPlayVideo] = useState(false);

  useEffect(() => {
    const media = window.matchMedia("(min-width: 640px)");
    const update = () => setPlayVideo(media.matches);
    update();
    media.addEventListener("change", update);
    return () => media.removeEventListener("change", update);
  }, []);

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
          {/* Instant, correctly-cropped artwork is the mobile hero and the
              desktop placeholder. The autoplay loop is enhanced in only on
              larger screens after hydration, preventing it from competing
              with text and fonts on mobile connections. */}
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
          {!reduceMotion && playVideo ? (
              <video
                autoPlay
                muted
                loop
                playsInline
                preload="metadata"
                aria-hidden
                className="relative h-full w-full object-cover"
              >
                <source src="/videos/hero-loop.mp4" type="video/mp4" />
              </video>
          ) : null}
        </motion.div>
        <div className="absolute inset-0 bg-gradient-to-t from-walnut via-walnut/30 to-charcoal/10" />
        <div className="absolute inset-0 bg-gradient-to-r from-walnut/55 via-transparent to-transparent" />
        {/* Independent top vignette so the floating nav stays legible regardless
            of the bottom-focused gradient above or what the video shows at any
            given frame. */}
        <div className="absolute inset-x-0 top-0 h-40 bg-gradient-to-b from-charcoal/55 to-transparent sm:h-56" />
      </motion.div>

      <div className="relative z-10 mx-auto w-full max-w-7xl px-6 pb-14 sm:px-8 sm:pb-16 lg:px-12 lg:pb-20">
        <div className="max-w-6xl sm:mx-auto sm:text-center">
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-ivory/85 sm:text-[13px]">
            {siteConfig.name} · Bacoor, Cavite
          </p>
          <h1 className="font-display mt-4 max-w-6xl text-[clamp(2.75rem,5.4vw,4.75rem)] font-medium leading-[1.02] tracking-[-0.02em] text-ivory">
            <span className="block lg:whitespace-nowrap">Move with intention.</span>
            <span className="block lg:whitespace-nowrap">Feel your best.</span>
          </h1>
          <p className="mt-6 max-w-[62ch] text-base leading-[1.7] text-ivory/85 sm:mx-auto lg:text-lg">
            Pilates, yoga and barre—thoughtfully guided in one boutique wellness studio in Bacoor, Cavite.
          </p>
          <div className="mt-7 flex flex-wrap items-center gap-x-5 gap-y-3 sm:justify-center">
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
          <div className="mt-7 flex items-center gap-2 text-ivory/80 sm:justify-center">
            <MapPin size={14} aria-hidden />
            <p className="text-xs font-medium uppercase tracking-[0.14em]">Opening soon</p>
          </div>
        </div>
      </div>
    </section>
  );
}
