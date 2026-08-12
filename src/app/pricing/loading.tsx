export default function PricingLoading() {
  return (
    <section className="mx-auto max-w-7xl animate-pulse px-6 pt-40 pb-14 sm:px-8 lg:px-12">
      <div className="h-4 w-24 rounded bg-charcoal/10" />
      <div className="mt-3 h-10 w-72 max-w-full rounded bg-charcoal/10" />
      <div className="mt-10 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
        {Array.from({ length: 6 }).map((_, i) => (
          <div key={i} className="h-64 rounded-2xl border border-charcoal/10 bg-ivory" />
        ))}
      </div>
    </section>
  );
}
