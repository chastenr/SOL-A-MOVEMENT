"use client";

import type { UseFormReturn } from "react-hook-form";
import { format, parseISO } from "date-fns";
import { getServiceBySlug } from "@/data/services";
import type { BookingFormValues } from "@/lib/validations";
import { Button } from "@/components/ui/Button";
import { cn } from "@/lib/utils";

type BookingFormProps = {
  form: UseFormReturn<BookingFormValues>;
  onContinue: () => void;
  onBack: () => void;
};

const inputClasses =
  "w-full rounded-xl border border-charcoal/15 bg-ivory px-4 py-3 text-sm text-charcoal placeholder:text-charcoal/35 transition-colors focus:border-charcoal focus:outline-none";

export function BookingForm({ form, onContinue, onBack }: BookingFormProps) {
  const {
    register,
    formState: { errors },
    watch,
  } = form;

  const service = getServiceBySlug(watch("service"));
  const date = watch("date");
  const time = watch("time");
  const packageName = watch("packageName");

  return (
    <div>
      <h2 className="font-display text-3xl text-charcoal sm:text-4xl">Your details</h2>
      <p className="mt-2 text-charcoal/60">Tell us a little about you so we can confirm your session.</p>

      <div className="mt-6 flex flex-wrap gap-x-6 gap-y-1 rounded-xl bg-cream/50 px-5 py-4 text-sm text-charcoal/70">
        <span>{service?.name}</span>
        <span aria-hidden>·</span>
        <span>{date ? format(parseISO(date), "EEEE, MMMM d") : ""}</span>
        <span aria-hidden>·</span>
        <span>{time}</span>
        {packageName && (
          <>
            <span aria-hidden>·</span>
            <span>{packageName}</span>
          </>
        )}
      </div>

      <form
        onSubmit={(event) => {
          event.preventDefault();
          onContinue();
        }}
        className="mt-8 grid gap-5 sm:grid-cols-2"
      >
        <Field label="First Name" required error={errors.firstName?.message}>
          <input {...register("firstName")} className={inputClasses} autoComplete="given-name" />
        </Field>
        <Field label="Last Name" required error={errors.lastName?.message}>
          <input {...register("lastName")} className={inputClasses} autoComplete="family-name" />
        </Field>
        <Field label="Email" required error={errors.email?.message}>
          <input
            type="email"
            {...register("email")}
            className={inputClasses}
            autoComplete="email"
          />
        </Field>
        <Field label="Phone" required error={errors.phone?.message}>
          <input type="tel" {...register("phone")} className={inputClasses} autoComplete="tel" />
        </Field>
        <Field label="Message / Notes" error={errors.notes?.message} className="sm:col-span-2">
          <textarea
            {...register("notes")}
            rows={4}
            className={cn(inputClasses, "resize-none")}
            placeholder="Anything we should know before your session? (optional)"
          />
        </Field>

        <div className="sm:col-span-2">
          <label className="flex items-start gap-3 text-sm text-charcoal/70">
            <input
              type="checkbox"
              {...register("consent")}
              className="mt-0.5 h-4 w-4 shrink-0 rounded border-charcoal/30 text-charcoal focus:ring-clay"
            />
            I agree to be contacted regarding my booking.
          </label>
          {errors.consent?.message && (
            <p className="mt-2 text-sm text-red-600">{errors.consent.message}</p>
          )}
        </div>

        <div className="mt-4 flex justify-between sm:col-span-2">
          <Button type="button" variant="secondary" size="lg" onClick={onBack}>
            Back
          </Button>
          <Button type="submit" size="lg">
            Continue
          </Button>
        </div>
      </form>
    </div>
  );
}

function Field({
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
