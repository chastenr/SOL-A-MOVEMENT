import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowRight, Check, Clock3, Droplets, MapPin, ShieldAlert, Sparkles } from "lucide-react";
import { services as staticServices } from "@/data/services";
import { siteConfig } from "@/data/site";
import { getServiceBySlug } from "@/lib/catalog/services";
import { safeJsonLd } from "@/lib/utils";
import { Button } from "@/components/ui/Button";
import { PageSchema } from "@/components/seo/PageSchema";

type ServicePageProps = { params: Promise<{ slug: string }> };

export function generateStaticParams() {
  return staticServices.map((service) => ({ slug: service.slug }));
}

export async function generateMetadata({ params }: ServicePageProps): Promise<Metadata> {
  const { slug } = await params;
  const service = await getServiceBySlug(slug);
  if (!service) return {};

  const title = `${service.name} Classes in Bacoor, Cavite`;
  const description = `${service.shortDescription} Join a ${service.duration} ${service.name} class at Veora Wellness in Bacoor, Cavite. ${service.level}.`;

  return {
    title,
    description,
    alternates: { canonical: `/services/${service.slug}` },
    openGraph: {
      type: "website",
      url: `/services/${service.slug}`,
      title: `${title} | ${siteConfig.name}`,
      description,
      images: [{ url: service.image.src, alt: service.image.alt }],
    },
    twitter: { card: "summary_large_image", title, description, images: [service.image.src] },
  };
}

export default async function ServiceDetailPage({ params }: ServicePageProps) {
  const { slug } = await params;
  const service = await getServiceBySlug(slug);
  if (!service) notFound();

  const otherServices = staticServices.filter((item) => item.slug !== slug).slice(0, 3);
  const pagePath = `/services/${service.slug}`;
  const faqs = [
    {
      question: `Is ${service.name} beginner-friendly?`,
      answer: `${service.name} is ${service.level.toLowerCase()}. Tell your instructor about injuries, pregnancy or concerns before class so they can advise on appropriate modifications.`,
    },
    {
      question: `How long is a ${service.name} class?`,
      answer: `The published duration is ${service.duration}. Please arrive 15–20 minutes early for your first Veora visit.`,
    },
    {
      question: "What should I bring?",
      answer: "Bring a water bottle and an optional small towel. Veora provides premium mats and class equipment; grip socks are highly recommended for Pilates and Barre.",
    },
  ];

  const serviceSchema = {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "Service",
        "@id": `${siteConfig.url}${pagePath}#service`,
        name: `${service.name} classes`,
        serviceType: service.name,
        description: service.description,
        category: service.category,
        image: service.image.src,
        provider: { "@id": `${siteConfig.url}/#localbusiness` },
        areaServed: { "@type": "City", name: "Bacoor" },
        url: `${siteConfig.url}${pagePath}`,
      },
      {
        "@type": "FAQPage",
        mainEntity: faqs.map((faq) => ({
          "@type": "Question",
          name: faq.question,
          acceptedAnswer: { "@type": "Answer", text: faq.answer },
        })),
      },
    ],
  };

  return (
    <>
      <PageSchema
        name={`${service.name} Classes in Bacoor, Cavite`}
        description={service.shortDescription}
        path={pagePath}
        breadcrumbs={[
          { name: "Home", path: "/" },
          { name: "Classes", path: "/services" },
          { name: service.name, path: pagePath },
        ]}
      />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: safeJsonLd(serviceSchema) }} />

      <article className="pb-20 pt-32 sm:pt-36">
        <div className="mx-auto max-w-7xl px-6 sm:px-8 lg:px-12">
          <nav aria-label="Breadcrumb" className="mb-7 text-xs text-charcoal/55">
            <ol className="flex flex-wrap items-center gap-2">
              <li><Link href="/" className="hover:text-clay">Home</Link></li>
              <li aria-hidden>/</li>
              <li><Link href="/services" className="hover:text-clay">Classes</Link></li>
              <li aria-hidden>/</li>
              <li aria-current="page" className="text-charcoal">{service.name}</li>
            </ol>
          </nav>

          <header className="grid overflow-hidden rounded-[2rem] bg-walnut text-ivory lg:grid-cols-2">
            <div className="flex flex-col justify-center px-7 py-10 sm:px-12 sm:py-14 lg:px-16">
              <p className="text-xs font-semibold uppercase tracking-[0.18em] text-cream/85">{service.category} · Bacoor, Cavite</p>
              <h1 className="font-display balance mt-4 text-[clamp(2.5rem,5vw,4.75rem)] leading-[1.02] tracking-[-0.02em]">
                {service.name} classes in Bacoor
              </h1>
              <p className="mt-6 max-w-xl text-base leading-relaxed text-ivory/78">{service.description}</p>
              <div className="mt-7 flex flex-wrap gap-3">
                <Button href={`/book?service=${service.slug}`} size="lg" className="bg-ivory text-charcoal hover:bg-cream">
                  Book {service.name}
                </Button>
                <Button href="/schedule" size="lg" variant="secondary" className="border-ivory/35 text-ivory hover:border-ivory">
                  View schedule
                </Button>
              </div>
            </div>
            <div className="relative min-h-80 lg:min-h-[36rem]">
              <Image src={service.image.src} alt={service.image.alt} fill priority quality={92} sizes="(min-width: 1024px) 50vw, 100vw" className="object-cover" />
            </div>
          </header>

          <section className="grid gap-8 py-14 lg:grid-cols-[1.4fr_0.8fr] lg:gap-14" aria-labelledby="benefits-heading">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.16em] text-clay">What to expect</p>
              <h2 id="benefits-heading" className="font-display mt-3 text-3xl text-charcoal sm:text-4xl">A guided class with clear, purposeful movement.</h2>
              <p className="mt-5 max-w-3xl leading-relaxed text-charcoal/70">
                Your instructor leads the session and offers guidance throughout. Exercises can be approached at your own pace; let the instructor know about any injury, pregnancy or health concern before class.
              </p>
              {service.benefits?.length ? (
                <ul className="mt-7 grid gap-3 sm:grid-cols-2" aria-label={`${service.name} benefits`}>
                  {service.benefits.map((benefit) => (
                    <li key={benefit} className="flex gap-3 rounded-2xl bg-cream/60 p-4 text-base leading-[1.65] text-charcoal/75">
                      <Check className="mt-0.5 h-4 w-4 shrink-0 text-clay" aria-hidden />
                      {benefit}
                    </li>
                  ))}
                </ul>
              ) : null}
            </div>

            <aside className="rounded-3xl border border-charcoal/10 bg-ivory p-6 shadow-[0_18px_50px_-42px_rgba(34,31,28,0.6)] sm:p-8" aria-label="Class details">
              <h2 className="font-display text-2xl text-charcoal">Class details</h2>
              <dl className="mt-6 space-y-5 text-sm">
                <div className="flex gap-3"><Clock3 className="h-5 w-5 shrink-0 text-clay" aria-hidden /><div><dt className="text-charcoal/45">Duration</dt><dd className="mt-1 text-charcoal">{service.duration}</dd></div></div>
                <div className="flex gap-3"><Sparkles className="h-5 w-5 shrink-0 text-clay" aria-hidden /><div><dt className="text-charcoal/45">Experience level</dt><dd className="mt-1 text-charcoal">{service.level}</dd></div></div>
                <div className="flex gap-3"><MapPin className="h-5 w-5 shrink-0 text-clay" aria-hidden /><div><dt className="text-charcoal/45">Studio</dt><dd className="mt-1 text-charcoal">Veora Wellness, Molino IV, Bacoor, Cavite</dd></div></div>
              </dl>
              {service.startingPrice ? <p className="mt-6 border-t border-charcoal/10 pt-5 text-sm"><span className="text-charcoal/45">Published price</span><br /><span className="mt-1 inline-block text-charcoal">{service.startingPrice}</span></p> : null}
              <Link href="/pricing" className="mt-4 inline-flex items-center gap-2 text-xs uppercase tracking-[0.12em] text-clay hover:text-walnut">View all packages <ArrowRight size={14} aria-hidden /></Link>
            </aside>
          </section>

          {service.classVariants?.length ? (
            <section className="rounded-[2rem] bg-sand/25 px-6 py-10 sm:px-10" aria-labelledby="formats-heading">
              <p className="text-xs font-semibold uppercase tracking-[0.16em] text-clay">Available formats</p>
              <h2 id="formats-heading" className="font-display mt-3 text-3xl text-charcoal">Choose your {service.name} practice.</h2>
              <ul className="mt-6 flex flex-wrap gap-2">
                {service.classVariants.map((variant) => <li key={variant} className="rounded-full border border-charcoal/10 bg-ivory px-4 py-2 text-sm text-charcoal/70">{variant}</li>)}
              </ul>
            </section>
          ) : null}

          {service.slug === "recovery-restore" && (
            <section className="rounded-[2rem] border border-clay/25 bg-clay/[0.07] px-6 py-10 sm:px-10" aria-labelledby="infratone-safety-heading">
              <div className="flex items-start gap-4">
                <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-clay/15 text-clay">
                  <ShieldAlert size={21} aria-hidden />
                </span>
                <div>
                  <p className="text-xs font-semibold uppercase tracking-[0.16em] text-clay">Infratone Safety</p>
                  <h2 id="infratone-safety-heading" className="font-display mt-2 text-3xl text-charcoal">Please check before a heated or infrared session.</h2>
                  <p className="mt-4 max-w-4xl text-base leading-[1.75] text-charcoal/75">
                    Heated and infrared sessions may not be suitable for everyone. If you have a medical condition, are pregnant, take medication that affects heat regulation, or are unsure whether Infratone is appropriate for you, please consult your physician before participating.
                  </p>
                </div>
              </div>
              <ul className="mt-7 grid gap-3 text-sm text-charcoal/70 sm:grid-cols-2 lg:grid-cols-3">
                {["Pregnancy", "Heart or cardiovascular conditions", "Blood pressure concerns", "Heat sensitivity", "Dehydration risk", "Medication affecting heat regulation", "Recent surgery or injury", "Other conditions where heat exposure may be inappropriate"].map((item) => (
                  <li key={item} className="flex gap-2 rounded-xl bg-ivory/70 p-3"><Check size={15} className="mt-0.5 shrink-0 text-clay" aria-hidden />{item}</li>
                ))}
              </ul>
              <div className="mt-6 flex gap-3 rounded-xl bg-ivory p-4 text-sm leading-relaxed text-charcoal/70">
                <Droplets size={19} className="mt-0.5 shrink-0 text-clay" aria-hidden />
                <p>Hydrate before, during and after your session. Stop immediately if you feel dizzy, faint, nauseated or unwell, and inform the instructor before class when appropriate. This guidance is general safety information, not medical diagnosis or individualized medical advice.</p>
              </div>
            </section>
          )}

          <section className="py-14" aria-labelledby="prepare-heading">
            <div className="grid gap-8 md:grid-cols-3">
              <div><h2 id="prepare-heading" className="font-display text-2xl text-charcoal">What to wear</h2><p className="mt-3 text-base leading-[1.7] text-charcoal/75">Wear comfortable workout clothing that lets you move freely. Grip socks are highly recommended for Pilates and Barre.</p></div>
              <div><h2 className="font-display text-2xl text-charcoal">What to bring</h2><p className="mt-3 text-base leading-[1.7] text-charcoal/75">Bring a water bottle and an optional small towel. Veora provides premium mats and all class equipment.</p></div>
              <div><h2 className="font-display text-2xl text-charcoal">When to arrive</h2><p className="mt-3 text-base leading-[1.7] text-charcoal/75">For your first visit, arrive 15–20 minutes early to check in and become familiar with the studio.</p></div>
            </div>
          </section>

          <section className="border-y border-charcoal/10 py-12" aria-labelledby="faq-heading">
            <h2 id="faq-heading" className="font-display text-3xl text-charcoal">{service.name} questions</h2>
            <dl className="mt-6 grid gap-6 md:grid-cols-3">
              {faqs.map((faq) => <div key={faq.question}><dt className="font-semibold text-charcoal">{faq.question}</dt><dd className="mt-2 text-base leading-[1.7] text-charcoal/75">{faq.answer}</dd></div>)}
            </dl>
            <Link href="/faq" className="mt-7 inline-flex items-center gap-2 text-xs uppercase tracking-[0.12em] text-clay hover:text-walnut">Read all studio FAQs <ArrowRight size={14} aria-hidden /></Link>
          </section>

          <section className="py-14 text-center" aria-labelledby="more-classes-heading">
            <p className="text-xs font-semibold uppercase tracking-[0.16em] text-clay">Keep exploring</p>
            <h2 id="more-classes-heading" className="font-display mt-3 text-3xl text-charcoal">More ways to move at Veora</h2>
            <div className="mt-7 flex flex-wrap justify-center gap-3">
              {otherServices.map((item) => <Button key={item.slug} href={`/services/${item.slug}`} variant="secondary">{item.name}</Button>)}
            </div>
          </section>
        </div>
      </article>
    </>
  );
}
