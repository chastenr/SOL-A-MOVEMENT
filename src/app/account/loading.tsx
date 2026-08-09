export default function AccountLoading() {
  return (
    <div className="animate-pulse">
      <div className="h-4 w-24 rounded bg-charcoal/10" />
      <div className="mt-3 h-8 w-56 max-w-full rounded bg-charcoal/10" />

      <div className="mt-10 grid gap-6 sm:grid-cols-2">
        <div className="h-36 rounded-2xl border border-charcoal/10 bg-ivory" />
        <div className="h-36 rounded-2xl border border-charcoal/10 bg-ivory" />
      </div>
    </div>
  );
}
