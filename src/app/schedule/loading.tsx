export default function ScheduleLoading() {
  return (
    <section className="mx-auto max-w-7xl animate-pulse px-6 pt-40 pb-16 sm:px-8 sm:pb-20 lg:px-12">
      <div className="rounded-[2rem] border border-charcoal/10 bg-cream/60 px-6 py-9 sm:px-9 sm:py-11">
        <div className="h-3 w-20 rounded bg-charcoal/10" />
        <div className="mt-4 h-12 w-72 max-w-full rounded bg-charcoal/10" />
        <div className="mt-5 h-5 w-full max-w-xl rounded bg-charcoal/10" />
      </div>
      <div className="mt-10 h-12 rounded-2xl border border-charcoal/10 bg-ivory" />
      <div className="mt-6 grid gap-4 md:grid-cols-2">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="h-72 rounded-[1.5rem] border border-charcoal/10 bg-ivory" />
        ))}
      </div>
    </section>
  );
}
