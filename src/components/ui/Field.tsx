export const fieldInputClasses =
  "w-full rounded-xl border border-charcoal/20 bg-ivory px-4 py-3 text-base leading-normal text-charcoal placeholder:text-charcoal/60 transition-colors focus:border-charcoal focus:outline-none";

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
      <label className="block">
        <span className="mb-2 block text-xs font-semibold uppercase tracking-[0.1em] text-charcoal/70">
          {label}
          {required && <span className="text-clay"> *</span>}
        </span>
        {children}
      </label>
      {error && (
        <p className="mt-1.5 text-sm text-red-600" role="alert">
          {error}
        </p>
      )}
    </div>
  );
}
