"use client";

import { format, parseISO } from "date-fns";
import { AlertCircle } from "lucide-react";
import { getServiceBySlug } from "@/data/services";
import { siteConfig } from "@/data/site";
import type { BookingFormValues } from "@/lib/validations";
import { Button } from "@/components/ui/Button";

type BookingReviewProps = {
  values: BookingFormValues;
  onBack: () => void;
  onConfirm: () => void;
  submitting: boolean;
  error: string | null;
};

export function BookingReview({ values, onBack, onConfirm, submitting, error }: BookingReviewProps) {
  const service = getServiceBySlug(values.service);

  return (
    <div>
      <h2 className="font-display text-3xl text-charcoal sm:text-4xl">Review your booking</h2>
      <p className="mt-2 text-charcoal/60">Please confirm your details — we&apos;ll follow up to confirm your requested time.</p>

      <dl className="mt-8 divide-y divide-charcoal/10 rounded-2xl border border-charcoal/10">
        <Row label="Service" value={service?.name ?? values.service} />
        {values.packageName && <Row label="Package" value={values.packageName} />}
        <Row label="Date" value={format(parseISO(values.date), "EEEE, MMMM d, yyyy")} />
        <Row label="Time" value={values.time} />
        <Row label="Name" value={`${values.firstName} ${values.lastName}`} />
        <Row label="Email" value={values.email} />
        <Row label="Phone" value={values.phone} />
        <Row label="Notes" value={values.notes || "—"} />
      </dl>

      <p className="mt-4 text-xs text-charcoal/50">
        Please cancel or reschedule at least {siteConfig.cancellationWindowHours} hours before your
        class to avoid a forfeited credit.
      </p>

      {error && (
        <div className="mt-6 flex items-start gap-3 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          <AlertCircle size={18} className="mt-0.5 shrink-0" aria-hidden />
          <p>{error}</p>
        </div>
      )}

      <div className="mt-10 flex justify-between">
        <Button type="button" variant="secondary" size="lg" onClick={onBack} disabled={submitting}>
          Back
        </Button>
        <Button type="button" size="lg" onClick={onConfirm} disabled={submitting}>
          {submitting ? "Booking…" : "Confirm Booking"}
        </Button>
      </div>
    </div>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex flex-col gap-1 px-5 py-4 sm:flex-row sm:items-baseline sm:justify-between">
      <dt className="text-xs uppercase tracking-[0.12em] text-charcoal/45">{label}</dt>
      <dd className="text-sm text-charcoal sm:text-right">{value}</dd>
    </div>
  );
}
