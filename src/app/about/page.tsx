import type { Metadata } from "next";
import { images } from "@/data/images";
import { siteConfig } from "@/data/site";
import { founder } from "@/data/team";
import { AnimatedSection } from "@/components/ui/AnimatedSection";
import { ImageReveal } from "@/components/ui/ImageReveal";
import { SectionHeading } from "@/components/ui/SectionHeading";
import { Button } from "@/components/ui/Button";

export const metadata: Metadata = {
  title: "About",
  description:
    "Learn about Veora Wellness — our philosophy, our studio experience and our approach to intentional movement.",
  alternates: { canonical: "/about" },
};

export default function AboutPage() {
  return (
    <>
      <section className="relative flex min-h-[60vh] items-end overflow-hidden bg-walnut">
        <div className="absolute inset-0">
          <ImageReveal
            src={images.hero.src}
            alt={images.hero.alt}
            fill
            priority
            sizes="100vw"
            containerClassName="h-full w-full"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-walnut via-walnut/40 to-walnut/10" />
        </div>
        <AnimatedSection
          y={18}
          className="relative z-10 mx-auto w-full max-w-7xl px-6 pb-12 pt-28 sm:px-8 lg:px-12"
        >
          <p className="text-xs font-medium uppercase tracking-[0.3em] text-ivory/70">About Us</p>
          <h1 className="font-display balance mt-6 max-w-3xl text-4xl leading-[1.1] text-ivory sm:text-5xl md:text-6xl">
            A studio built around how movement should feel.
          </h1>
        </AnimatedSection>
      </section>

      <section className="mx-auto max-w-3xl px-6 py-14 text-center sm:px-8 sm:py-16">
        <AnimatedSection>
          <p className="font-display balance text-2xl leading-relaxed text-charcoal sm:text-3xl">
            Veora was created for anyone who wants movement to feel less like a task and more
            like a return to themselves — strength built with care, mobility restored with
            patience, and a studio that feels like it was designed just for you.
          </p>
        </AnimatedSection>
      </section>

      <section className="mx-auto max-w-7xl px-6 py-10 sm:px-8 lg:px-12">
        <div className="grid items-center gap-8 lg:grid-cols-2 lg:gap-14">
          <ImageReveal
            src={images.introduction.src}
            alt={images.introduction.alt}
            width={800}
            height={960}
            containerClassName="mask-arch-deep aspect-[4/5] shadow-glow-warm lg:order-2"
            sizes="(min-width: 1024px) 45vw, 100vw"
          />
          <AnimatedSection>
            <SectionHeading
              eyebrow="Our Philosophy"
              heading="Movement as a practice, not a punishment."
              body="We believe movement should build you up — physically and mentally. Every Veora session is guided with intention, blending strength, control and breath so that how you move in the studio changes how you move through your life."
            />
          </AnimatedSection>
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-6 py-14 sm:px-8 sm:py-16 lg:px-12">
        <div className="grid items-center gap-8 lg:grid-cols-2 lg:gap-14">
          <AnimatedSection>
            <SectionHeading
              eyebrow="The Veora Studio"
              heading="A calm, considered space to show up as you are."
              body="Located in Bacoor, Cavite, our studio is quietly, intentionally designed — so you can focus on how you feel rather than how things look. Premium mats and equipment, complimentary lockers and shower facilities are provided for every visit."
            />
          </AnimatedSection>
          <ImageReveal
            src={images.studioExperienceOne.src}
            alt={images.studioExperienceOne.alt}
            width={800}
            height={960}
            containerClassName="mask-arch-deep aspect-[4/5] shadow-glow-warm"
            sizes="(min-width: 1024px) 45vw, 100vw"
          />
        </div>
      </section>

      {founder && (
        <section className="bg-cream/40 py-14 sm:py-16">
          <div className="mx-auto max-w-7xl px-6 sm:px-8 lg:px-12">
            <AnimatedSection>
              <SectionHeading
                align="center"
                eyebrow="Founder"
                heading="Led with care and attention to detail."
                className="mx-auto"
              />
            </AnimatedSection>

            <AnimatedSection className="mt-10 grid items-center gap-8 rounded-2xl bg-ivory p-6 sm:grid-cols-[200px_1fr] sm:p-10">
              <div className="flex aspect-square items-center justify-center rounded-2xl bg-sand/60">
                <span className="font-display text-5xl text-charcoal/40">V</span>
              </div>
              <div>
                <p className="font-display text-2xl text-charcoal">{founder.name}</p>
                <p className="mt-1 text-sm uppercase tracking-[0.14em] text-clay">{founder.role}</p>
                <p className="mt-4 max-w-xl text-charcoal/70">{founder.bio}</p>
              </div>
            </AnimatedSection>
          </div>
        </section>
      )}

      <section className="mx-auto max-w-4xl px-6 py-14 text-center sm:px-8 sm:py-16">
        <AnimatedSection>
          <p className="text-xs font-medium uppercase tracking-[0.22em] text-clay">Our Mission</p>
          <p className="font-display balance mt-6 text-3xl leading-tight text-charcoal sm:text-4xl">
            We believe movement should be accessible, intentional and enjoyable for every body —
            and that belief guides every class we teach.
          </p>
        </AnimatedSection>
      </section>

      <section className="mx-auto max-w-7xl px-6 pb-14 sm:px-8 sm:pb-16 lg:px-12">
        <AnimatedSection className="texture-plaster rounded-3xl bg-walnut px-8 py-12 text-center sm:px-16 sm:py-16">
          <SectionHeading
            align="center"
            eyebrow="Community"
            heading="A studio, and a community."
            body="Veora welcomes everyone, regardless of age, gender or fitness level — a place to be seen, supported and encouraged as you build a practice that's your own."
            tone="light"
            className="mx-auto"
          />
          <div className="mt-8 flex justify-center">
            <Button href="/book" size="lg">
              {siteConfig.bookingCtaLabel}
            </Button>
          </div>
        </AnimatedSection>
      </section>
    </>
  );
}
