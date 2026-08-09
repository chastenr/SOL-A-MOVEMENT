export default function ServicesLoading() {
  return (
    <section className="mx-auto max-w-7xl animate-pulse px-6 pt-28 pb-14 sm:px-8 lg:px-12">
      <div className="h-4 w-24 rounded bg-charcoal/10" />
      <div className="mt-3 h-10 w-96 max-w-full rounded bg-charcoal/10" />
      <div className="mt-10 flex flex-col gap-6">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="h-40 rounded-2xl border border-charcoal/10 bg-ivory" />
        ))}
      </div>
    </section>
  );
}
