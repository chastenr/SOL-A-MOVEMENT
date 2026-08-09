"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { paymentSettingFormSchema, type PaymentSettingFormValues } from "@/lib/validations";
import {
  createPaymentSettingAction,
  updatePaymentSettingAction,
} from "@/app/admin/(protected)/settings/payments/actions";
import { Button } from "@/components/ui/Button";
import { Field, fieldInputClasses } from "@/components/ui/Field";

const METHODS = ["bank_transfer", "gcash_qr", "paymongo_card", "cash", "other"] as const;
const METHOD_LABELS: Record<(typeof METHODS)[number], string> = {
  bank_transfer: "Bank Transfer",
  gcash_qr: "GCash / QR",
  paymongo_card: "Card (PayMongo)",
  cash: "Cash",
  other: "Other",
};
const selectClasses = fieldInputClasses + " appearance-none";

export function PaymentSettingForm({
  settingId,
  defaultValues,
}: {
  settingId?: string;
  defaultValues: PaymentSettingFormValues;
}) {
  const router = useRouter();
  const [submitting, setSubmitting] = useState(false);
  const [serverError, setServerError] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<PaymentSettingFormValues>({
    resolver: zodResolver(paymentSettingFormSchema),
    defaultValues,
  });

  async function onSubmit(values: PaymentSettingFormValues) {
    setSubmitting(true);
    setServerError(null);
    try {
      const result = settingId
        ? await updatePaymentSettingAction(settingId, values)
        : await createPaymentSettingAction(values);
      if ("error" in result) {
        setServerError(result.error);
        return;
      }
      router.push("/admin/payments");
      router.refresh();
    } catch {
      setServerError("Something went wrong. Please try again.");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="grid gap-5 sm:grid-cols-2">
      <Field label="Method" required error={errors.method?.message}>
        <select {...register("method")} className={selectClasses}>
          {METHODS.map((method) => (
            <option key={method} value={method}>
              {METHOD_LABELS[method]}
            </option>
          ))}
        </select>
      </Field>
      <Field label="Label (shown to customers)" required error={errors.label?.message}>
        <input {...register("label")} className={fieldInputClasses} placeholder="BDO Bank Transfer" />
      </Field>

      <Field label="Bank Name (optional)" error={errors.bankName?.message}>
        <input {...register("bankName")} className={fieldInputClasses} placeholder="BDO" />
      </Field>
      <Field label="Account Name (optional)" error={errors.accountName?.message}>
        <input {...register("accountName")} className={fieldInputClasses} placeholder="Veora Wellness Inc." />
      </Field>

      <Field label="Account / Mobile Number (optional)" error={errors.accountNumber?.message}>
        <input {...register("accountNumber")} className={fieldInputClasses} placeholder="0011 2233 4455" />
      </Field>
      <Field label="QR Code Image URL (optional)" error={errors.qrImageUrl?.message}>
        <input {...register("qrImageUrl")} className={fieldInputClasses} placeholder="https://..." />
      </Field>

      <Field
        label="Instructions (optional)"
        error={errors.instructions?.message}
        className="sm:col-span-2"
      >
        <textarea
          {...register("instructions")}
          rows={3}
          className={fieldInputClasses}
          placeholder="Send the exact amount and keep your receipt — you'll upload it on the next step."
        />
      </Field>

      <div className="flex items-center gap-2">
        <input type="checkbox" {...register("isActive")} className="h-4 w-4 accent-charcoal" />
        <label className="text-sm text-charcoal/70">Active (shown at checkout)</label>
      </div>
      <Field label="Sort Order" required error={errors.sortOrder?.message}>
        <input type="number" step="1" {...register("sortOrder")} className={fieldInputClasses} />
      </Field>

      {serverError && <p className="text-sm text-red-600 sm:col-span-2">{serverError}</p>}

      <div className="flex gap-3 sm:col-span-2">
        <Button type="submit" disabled={submitting}>
          {submitting ? "Saving…" : settingId ? "Save Changes" : "Add Payment Method"}
        </Button>
        <Button type="button" variant="secondary" onClick={() => router.push("/admin/payments")}>
          Cancel
        </Button>
      </div>
    </form>
  );
}
