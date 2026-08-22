import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, ArrowRight, CalendarDays, Clock } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { articles, getArticle } from "@/data/articles";
import { siteConfig } from "@/data/site";
import { createPageMetadata } from "@/lib/seo-metadata";
import { PageSchema } from "@/components/seo/PageSchema";
import { safeJsonLd } from "@/lib/utils";

export const dynamicParams = false;

export function generateStaticParams() {
  return articles.map((article) => ({ slug: article.slug }));
}

export async function generateMetadata({ params }: PageProps<"/articles/[slug]">): Promise<Metadata> {
  const { slug } = await params;
  const article = getArticle(slug);
  if (!article) return {};

  const metadata = createPageMetadata({
    title: article.title,
    description: article.excerpt,
    path: `/articles/${article.slug}`,
  });

  return {
    ...metadata,
    openGraph: {
      ...metadata.openGraph,
      type: "article",
      publishedTime: article.publishedAt,
      authors: [siteConfig.name],
      images: [{ url: article.image.src, alt: article.image.alt }],
    },
  };
}

function formatPublishedDate(value: string) {
  return new Intl.DateTimeFormat("en-PH", {
    year: "numeric",
    month: "long",
    day: "numeric",
    timeZone: "Asia/Manila",
  }).format(new Date(`${value}T12:00:00+08:00`));
}

export default async function ArticlePage({ params }: PageProps<"/articles/[slug]">) {
  const { slug } = await params;
  const article = getArticle(slug);
  if (!article) notFound();

  const articleSchema = {
    "@context": "https://schema.org",
    "@type": "Article",
    headline: article.title,
    description: article.excerpt,
    datePublished: article.publishedAt,
    dateModified: article.publishedAt,
    image: article.image.src,
    mainEntityOfPage: `${siteConfig.url}/articles/${article.slug}`,
    author: { "@type": "Organization", name: siteConfig.name, url: siteConfig.url },
    publisher: {
      "@type": "Organization",
      name: siteConfig.name,
      logo: { "@type": "ImageObject", url: `${siteConfig.url}/veora-logo-full.png` },
    },
  };

  return (
    <>
      <PageSchema
        name={article.title}
        description={article.excerpt}
        path={`/articles/${article.slug}`}
        breadcrumbs={[
          { name: "Home", path: "/" },
          { name: "Articles", path: "/articles" },
          { name: article.title, path: `/articles/${article.slug}` },
        ]}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: safeJsonLd(articleSchema) }}
      />

      <article className="pb-20 pt-32 sm:pb-24 sm:pt-36">
        <header className="mx-auto max-w-5xl px-6 sm:px-8">
          <nav aria-label="Breadcrumb" className="mb-8">
            <Link
              href="/articles"
              className="inline-flex items-center gap-2 text-[11px] font-semibold uppercase tracking-[0.16em] text-charcoal/52 transition-colors hover:text-clay focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-clay"
            >
              <ArrowLeft size={14} aria-hidden /> All articles
            </Link>
          </nav>

          <div className="max-w-4xl">
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-clay">{article.eyebrow}</p>
            <h1 className="mt-4 font-display text-[clamp(3.25rem,7vw,6.75rem)] leading-[0.9] tracking-[-0.04em] text-charcoal">
              {article.title}
            </h1>
            <p className="mt-6 max-w-2xl text-base leading-[1.8] text-charcoal/70 sm:text-lg">{article.excerpt}</p>
            <div className="mt-7 flex flex-wrap items-center gap-x-6 gap-y-2 text-[11px] font-medium uppercase tracking-[0.14em] text-charcoal/48">
              <span className="flex items-center gap-2"><CalendarDays size={14} aria-hidden /> {formatPublishedDate(article.publishedAt)}</span>
              <span className="flex items-center gap-2"><Clock size={14} aria-hidden /> {article.readTime}</span>
              <span>By Veora Wellness</span>
            </div>
          </div>
        </header>

        <div className="mx-auto mt-10 max-w-7xl px-4 sm:mt-12 sm:px-8 lg:px-12">
          <div className="relative aspect-[16/9] overflow-hidden rounded-[1.75rem] bg-sand sm:rounded-[2.25rem]">
            <Image
              src={article.image.src}
              alt={article.image.alt}
              fill
              priority
              sizes="(min-width: 1280px) 1184px, 100vw"
              className="object-cover"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-walnut/20 via-transparent to-transparent" />
          </div>
        </div>

        <div className="mx-auto mt-12 grid max-w-5xl gap-12 px-6 sm:mt-16 sm:px-8 lg:grid-cols-[13rem_minmax(0,1fr)] lg:gap-16">
          <aside className="lg:sticky lg:top-32 lg:self-start">
            <p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-charcoal/45">In this guide</p>
            <nav aria-label="Article sections" className="mt-4 border-l border-charcoal/12 pl-4">
              <ol className="space-y-3">
                {article.sections.map((section) => (
                  <li key={section.id}>
                    <a href={`#${section.id}`} className="text-xs leading-relaxed text-charcoal/55 transition-colors hover:text-clay focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-clay">
                      {section.title}
                    </a>
                  </li>
                ))}
              </ol>
            </nav>
          </aside>

          <div className="min-w-0">
            <div className="space-y-5 text-[1.0625rem] leading-[1.85] text-charcoal/78 sm:text-lg">
              {article.introduction.map((paragraph) => <p key={paragraph}>{paragraph}</p>)}
            </div>

            <div className="my-10 rounded-[1.5rem] border border-clay/20 bg-sand/35 p-6 sm:p-8">
              <p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-clay">The short answer</p>
              <dl className="mt-5 grid gap-5 sm:grid-cols-3">
                <div><dt className="font-display text-2xl text-charcoal">Pilates</dt><dd className="mt-1 text-sm leading-relaxed text-charcoal/65">Control, core strength and precision.</dd></div>
                <div><dt className="font-display text-2xl text-charcoal">Yoga</dt><dd className="mt-1 text-sm leading-relaxed text-charcoal/65">Breath, mobility and mindful flow.</dd></div>
                <div><dt className="font-display text-2xl text-charcoal">Barre</dt><dd className="mt-1 text-sm leading-relaxed text-charcoal/65">Posture, rhythm and endurance.</dd></div>
              </dl>
            </div>

            {article.sections.map((section) => (
              <section key={section.id} id={section.id} className="scroll-mt-32 border-t border-charcoal/10 py-10 first:border-t-0 sm:py-12">
                <h2 className="font-display text-4xl leading-[1.02] tracking-[-0.025em] text-charcoal sm:text-5xl">{section.title}</h2>
                <div className="mt-6 space-y-5 text-[1.0625rem] leading-[1.85] text-charcoal/78 sm:text-lg">
                  {section.paragraphs.map((paragraph) => <p key={paragraph}>{paragraph}</p>)}
                </div>
                {section.bullets && (
                  <ul className="mt-7 space-y-3 border-l border-clay/35 pl-5 text-base leading-relaxed text-charcoal/72">
                    {section.bullets.map((bullet) => <li key={bullet}>{bullet}</li>)}
                  </ul>
                )}
              </section>
            ))}

            <section className="mt-4 rounded-[1.75rem] bg-walnut px-6 py-9 text-ivory sm:px-9 sm:py-11">
              <p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-ivory/55">Your next step</p>
              <h2 className="mt-3 max-w-[15ch] font-display text-4xl leading-none tracking-[-0.025em] sm:text-5xl">Try the practice that sounds like you.</h2>
              <p className="mt-5 max-w-xl text-sm leading-[1.8] text-ivory/70 sm:text-base">Explore Veora’s class formats, then choose a session that fits your pace and schedule.</p>
              <div className="mt-7 flex flex-wrap gap-3">
                <Button href="/services" className="bg-ivory text-charcoal hover:bg-cream">Explore classes <ArrowRight size={15} aria-hidden /></Button>
                <Button href="/schedule" variant="secondary" className="border-ivory/35 text-ivory hover:border-ivory">View schedule</Button>
              </div>
            </section>
          </div>
        </div>
      </article>
    </>
  );
}
