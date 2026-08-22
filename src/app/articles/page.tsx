import Image from "next/image";
import Link from "next/link";
import { ArrowUpRight, Clock } from "lucide-react";
import { AnimatedSection } from "@/components/ui/AnimatedSection";
import { articles } from "@/data/articles";
import { createPageMetadata } from "@/lib/seo-metadata";
import { PageSchema } from "@/components/seo/PageSchema";

export const metadata = createPageMetadata({
  title: "Movement & Wellness Articles",
  description:
    "Explore practical Veora Wellness guides about Pilates, yoga, barre and building a movement practice that feels right for you.",
  path: "/articles",
});

export default function ArticlesPage() {
  return (
    <>
      <PageSchema
        name="Movement & Wellness Articles"
        description="Practical Veora Wellness guides about Pilates, yoga, barre and building a movement practice."
        path="/articles"
        breadcrumbs={[
          { name: "Home", path: "/" },
          { name: "Articles", path: "/articles" },
        ]}
      />
      <section className="mx-auto max-w-7xl px-6 pb-10 pt-36 sm:px-8 sm:pb-12 sm:pt-40 lg:px-12">
        <AnimatedSection className="max-w-4xl">
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-clay">Veora Articles</p>
          <h1 className="mt-4 max-w-[13ch] font-display text-[clamp(3.25rem,7vw,6.5rem)] leading-[0.92] tracking-[-0.035em] text-charcoal">
            Move with a little more clarity.
          </h1>
          <p className="mt-6 max-w-2xl text-base leading-[1.8] text-charcoal/70 sm:text-lg">
            Thoughtful, practical guidance for choosing classes, beginning a movement practice and making your time at Veora feel more familiar.
          </p>
        </AnimatedSection>
      </section>

      <section className="mx-auto max-w-7xl px-6 pb-20 sm:px-8 sm:pb-24 lg:px-12">
        <div className="border-t border-charcoal/12 pt-8">
          <div className="grid gap-7 sm:grid-cols-2 lg:grid-cols-3">
            {articles.map((article, index) => (
              <AnimatedSection key={article.slug} delay={index * 0.06} className="h-full">
                <article className="group flex h-full flex-col overflow-hidden rounded-[1.75rem] border border-charcoal/10 bg-cream/35 transition-[transform,box-shadow] duration-500 ease-[var(--ease-veora)] hover:-translate-y-1 hover:shadow-[0_24px_60px_-36px_rgba(34,31,28,0.45)]">
                  <Link href={`/articles/${article.slug}`} className="relative block aspect-[4/3] overflow-hidden focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-clay">
                    <Image
                      src={article.image.src}
                      alt={article.image.alt}
                      fill
                      priority={index === 0}
                      sizes="(min-width: 1024px) 33vw, (min-width: 640px) 50vw, 100vw"
                      className="object-cover transition-transform duration-700 ease-[var(--ease-veora)] group-hover:scale-[1.035]"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-charcoal/22 via-transparent to-transparent" />
                  </Link>

                  <div className="flex flex-1 flex-col p-6 sm:p-7">
                    <div className="flex flex-wrap items-center gap-x-4 gap-y-2 text-[10px] font-semibold uppercase tracking-[0.16em] text-charcoal/48">
                      <span className="text-clay">{article.eyebrow}</span>
                      <span className="flex items-center gap-1.5"><Clock size={12} aria-hidden /> {article.readTime}</span>
                    </div>
                    <h2 className="mt-4 font-display text-3xl leading-[1.04] tracking-[-0.02em] text-charcoal">
                      <Link href={`/articles/${article.slug}`} className="transition-colors hover:text-walnut focus-visible:outline-none focus-visible:underline">
                        {article.title}
                      </Link>
                    </h2>
                    <p className="mt-4 text-sm leading-[1.75] text-charcoal/68">{article.excerpt}</p>
                    <Link
                      href={`/articles/${article.slug}`}
                      className="mt-7 inline-flex items-center gap-2 self-start text-[11px] font-semibold uppercase tracking-[0.17em] text-charcoal transition-colors hover:text-clay focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-clay"
                    >
                      Read article <ArrowUpRight size={14} aria-hidden />
                    </Link>
                  </div>
                </article>
              </AnimatedSection>
            ))}
          </div>
        </div>
      </section>
    </>
  );
}
