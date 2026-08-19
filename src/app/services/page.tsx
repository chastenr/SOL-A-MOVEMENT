import { createPageMetadata } from "@/lib/seo-metadata";
import { getServices } from "@/lib/catalog/services";
import { getUpcomingSessions } from "@/lib/catalog/sessions";
import { AnimatedSection } from "@/components/ui/AnimatedSection";
import { ServiceCard } from "@/components/services/ServiceCard";
import { ScheduleExplorer } from "@/components/schedule/ScheduleExplorer";
import { ServiceSchema } from "@/components/seo/ServiceSchema";
import { Button } from "@/components/ui/Button";
import { ArrowDown, CalendarDays, Check, Sparkles } from "lucide-react";

export const metadata = createPageMetadata({
  title: "Pilates, Yoga & Wellness Classes in Bacoor",
  description:
    "Explore Veora Wellness classes in Bacoor, Cavite: Mat Pilates, yoga, barre, strength, HIIT, heated and red light recovery formats, and ballet.",
  path: "/services",
});

export default async function ServicesPage() {
  const [services, sessions] = await Promise.all([getServices(), getUpcomingSessions(60)]);

  return (
    <>
      <ServiceSchema />
      <section className="px-4 pt-32 pb-8 sm:px-6 sm:pt-36 sm:pb-10 lg:px-8">
        <AnimatedSection className="texture-plaster relative mx-auto max-w-7xl overflow-hidden rounded-[2rem] bg-walnut px-6 py-9 text-ivory shadow-[0_28px_80px_-48px_rgba(34,31,28,0.8)] sm:px-10 sm:py-11 lg:px-14 lg:py-12">
          <div className="pointer-events-none absolute -top-32 right-0 h-80 w-80 rounded-full bg-clay/25 blur-3xl" />
          <div className="pointer-events-none absolute -bottom-40 left-1/3 h-72 w-72 rounded-full bg-cream/10 blur-3xl" />
          <div className="relative z-10 grid items-end gap-8 lg:grid-cols-[1fr_auto]">
            <div className="max-w-3xl">
              <p className="mb-3 flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.18em] text-cream/85">
                <Sparkles size={14} aria-hidden /> Our Classes
              </p>
              <h1 className="font-display balance text-[clamp(2.5rem,4.25vw,4.25rem)] leading-[1.02] tracking-[-0.02em]">
                Find the movement that feels like you.
              </h1>
              <p className="mt-4 max-w-[62ch] text-base leading-[1.6] text-ivory/85">
                From mindful flow to energizing strength, there is a Veora class for every body and every mood. All levels are welcome.
              </p>
              <ul className="mt-5 flex flex-wrap gap-x-6 gap-y-2 text-sm font-medium text-ivory/85" aria-label="Class benefits">
                <li className="flex items-center gap-2"><Check size={14} className="text-cream" aria-hidden /> Beginner-friendly</li>
                <li className="flex items-center gap-2"><Check size={14} className="text-cream" aria-hidden /> Expert-led sessions</li>
                <li className="flex items-center gap-2"><Check size={14} className="text-cream" aria-hidden /> Small-group guidance</li>
              </ul>
            </div>
            <div className="flex flex-wrap gap-3 lg:max-w-52 lg:flex-col">
              <Button href="#live-schedule" size="lg" className="bg-ivory text-charcoal hover:bg-cream">
                <CalendarDays size={15} aria-hidden /> View live schedule
              </Button>
              <Button href="/pricing" size="lg" variant="secondary" className="border-ivory/35 text-ivory hover:border-ivory">
                View packages
              </Button>
            </div>
          </div>
        </AnimatedSection>
      </section>

      <section id="live-schedule" className="scroll-mt-28 px-4 pb-16 sm:px-6 sm:pb-20 lg:px-8">
        <div className="mx-auto max-w-7xl rounded-[2rem] border border-charcoal/10 bg-sand/25 px-4 py-8 sm:px-8 sm:py-10 lg:px-10">
          <AnimatedSection className="mb-7 flex flex-col gap-5 sm:flex-row sm:items-end sm:justify-between">
            <div className="max-w-2xl">
              <p className="flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.18em] text-clay">
                <span className="relative flex h-2 w-2" aria-hidden>
                  <span className="absolute inline-flex h-full w-full rounded-full bg-clay/35" />
                  <span className="relative inline-flex h-2 w-2 rounded-full bg-clay" />
                </span>
                Live studio schedule
              </p>
              <h2 className="font-display balance mt-3 text-3xl leading-tight text-charcoal sm:text-4xl md:text-5xl">
                Find your next class.
              </h2>
              <p className="mt-4 max-w-[62ch] text-base leading-[1.7] text-charcoal/75">
                Browse real upcoming classes, coaches, times and remaining spots. You&rsquo;ll only be asked to sign in when you choose to reserve.
              </p>
            </div>
            <Button href="/schedule" variant="secondary" className="shrink-0">
              Open full schedule
            </Button>
          </AnimatedSection>

          {sessions.length > 0 ? (
            <ScheduleExplorer sessions={sessions} />
          ) : (
            <div className="rounded-[1.5rem] border border-dashed border-charcoal/15 bg-ivory px-6 py-9 text-center sm:px-8">
              <h3 className="font-display text-2xl text-charcoal">New class times are coming soon.</h3>
              <p className="mx-auto mt-2 max-w-xl text-sm leading-relaxed text-charcoal/70">
                The live calendar will update automatically as soon as the studio publishes its next sessions.
              </p>
            </div>
          )}
        </div>
      </section>

      <section id="class-menu" className="mx-auto max-w-7xl scroll-mt-32 px-6 pb-16 sm:px-8 sm:pb-20 lg:px-12">
        <AnimatedSection className="mb-8 flex flex-col gap-5 border-b border-charcoal/10 pb-7 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-clay">Choose your practice</p>
            <h2 className="font-display mt-2 text-3xl text-charcoal sm:text-4xl">What are you in the mood for?</h2>
          </div>
          <a href="#class-grid" className="inline-flex items-center gap-2 text-xs font-medium uppercase tracking-[0.14em] text-charcoal/55 transition-colors hover:text-clay">
            Explore all classes <ArrowDown size={14} aria-hidden />
          </a>
        </AnimatedSection>

        <AnimatedSection className="mb-10 flex gap-2 overflow-x-auto pb-2 no-scrollbar" y={16}>
          {services.map((service) => (
            <a
              key={service.slug}
              href={`#${service.slug}`}
              className="shrink-0 rounded-full border border-charcoal/20 bg-ivory px-4 py-2.5 text-xs font-semibold uppercase tracking-[0.12em] text-charcoal/75 transition-colors hover:border-clay hover:bg-cream/60 hover:text-charcoal"
            >
              {service.name}
            </a>
          ))}
        </AnimatedSection>

        <div id="class-grid" className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3 lg:gap-7" data-no-text-reveal>
          {services.map((service, index) => (
            <AnimatedSection
              key={service.slug}
              delay={Math.min(index * 0.05, 0.3)}
              className="h-full"
            >
              <ServiceCard service={service} variant="detailed" priority={index < 3} />
            </AnimatedSection>
          ))}
        </div>
      </section>

      <section className="bg-sand/25 py-14 sm:py-16">
        <div className="mx-auto max-w-3xl px-6 text-center sm:px-8">
          <AnimatedSection>
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-clay">Studio Rentals</p>
            <h2 className="font-display balance mt-3 text-3xl text-charcoal sm:text-4xl md:text-5xl">Host your next event at Veora.</h2>
            <p className="mx-auto mt-5 max-w-[62ch] text-base leading-[1.7] text-charcoal/75 sm:text-[1.0625rem]">Our studio is also available for private rentals — perfect for wellness events, workshops and intimate gatherings, with or without an instructor.</p>
            <div className="mt-6 flex flex-wrap justify-center gap-4">
              <Button href="/pricing#studio-rentals" size="lg">
                See Rental Pricing
              </Button>
              <Button href="/contact" size="lg" variant="secondary">
                Inquire Directly
              </Button>
            </div>
          </AnimatedSection>
        </div>
      </section>
    </>
  );
}
