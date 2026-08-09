export default function AdminLoading() {
  return (
    <div className="animate-pulse">
      <div className="h-7 w-40 rounded bg-charcoal/10" />
      <div className="mt-2 h-4 w-72 max-w-full rounded bg-charcoal/5" />

      <div className="mt-8 flex flex-wrap gap-3">
        <div className="h-10 w-48 rounded-lg bg-charcoal/5" />
        <div className="h-10 w-32 rounded-lg bg-charcoal/5" />
      </div>

      <div className="mt-6 overflow-hidden rounded-xl border border-charcoal/10 bg-ivory">
        {Array.from({ length: 6 }).map((_, index) => (
          <div key={index} className="flex items-center gap-6 border-b border-charcoal/5 px-4 py-4 last:border-0">
            <div className="h-4 w-1/4 rounded bg-charcoal/10" />
            <div className="h-4 w-1/5 rounded bg-charcoal/5" />
            <div className="h-4 w-1/6 rounded bg-charcoal/5" />
            <div className="ml-auto h-6 w-20 rounded-full bg-charcoal/5" />
          </div>
        ))}
      </div>
    </div>
  );
}
