export const fieldInputClasses =
  "w-full rounded-xl border border-charcoal/15 bg-ivory px-4 py-3 text-sm text-charcoal placeholder:text-charcoal/35 transition-colors focus:border-charcoal focus:outline-none";

export function Field({
  label,
  required,
  error,
  children,
  className,
}: {
  label: string;
  required?: boolean;
  error?: string;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <div className={className}>
      <label className="mb-1.5 block text-xs uppercase tracking-[0.1em] text-charcoal/50">
        {label}
        {required && <span className="text-clay"> *</span>}
      </label>
      {children}
      {error && <p className="mt-1.5 text-sm text-red-600">{error}</p>}
    </div>
  );
}
