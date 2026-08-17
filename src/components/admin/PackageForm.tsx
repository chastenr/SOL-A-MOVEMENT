"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useForm, useWatch } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { packageFormSchema, type PackageFormValues } from "@/lib/validations";
import { createPackageAction, updatePackageAction } from "@/app/admin/(protected)/packages/actions";
import { Button } from "@/components/ui/Button";
import { Field, fieldInputClasses } from "@/components/ui/Field";

const CATEGORIES = ["classic", "restore", "ballet", "studio_rental"] as const;
const GROUPS = ["intro_offer", "single_session", "package", "membership", "private_session", "special_offer"] as const;
const SERVICE_SLUGS = ["mat-pilates", "yoga", "barre", "strength-hiit", "recovery-restore", "ballet"] as const;
const EXPIRES_FROM = ["purchase", "first_booking"] as const;

const selectClasses = fieldInputClasses + " appearance-none";

export function PackageForm({
  packageId,
  defaultValues,
}: {
  packageId?: string;
  defaultValues: PackageFormValues;
}) {
  const router = useRouter();
  const [submitting, setSubmitting] = useState(false);
  const [serverError, setServerError] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    control,
    formState: { errors },
  } = useForm<PackageFormValues>({
    resolver: zodResolver(packageFormSchema),
    defaultValues,
  });

  const isRecommended = useWatch({ control, name: "isRecommended" });
  const entitlementType = useWatch({ control, name: "entitlementType" });

  async function onSubmit(values: PackageFormValues) {
    setSubmitting(true);
    setServerError(null);
    try {
      const result = packageId
        ? await updatePackageAction(packageId, values)
        : await createPackageAction(values);
      if ("error" in result) {
        setServerError(result.error);
        return;
      }
      router.push("/admin/packages");
      router.refresh();
    } catch {
      setServerError("Something went wrong. Please try again.");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="grid gap-5 sm:grid-cols-2">
      <Field label="Slug" required error={errors.slug?.message}>
        <input {...register("slug")} className={fieldInputClasses} placeholder="classic-foundation" />
      </Field>
      <Field label="Name" required error={errors.name?.message}>
        <input {...register("name")} className={fieldInputClasses} />
      </Field>

      <Field label="Category" required error={errors.category?.message}>
        <select {...register("category")} className={selectClasses}>
          {CATEGORIES.map((c) => (
            <option key={c} value={c}>
              {c}
            </option>
          ))}
        </select>
      </Field>
      <Field label="Group" required error={errors.packageGroup?.message}>
        <select {...register("packageGroup")} className={selectClasses}>
          {GROUPS.map((g) => (
            <option key={g} value={g}>
              {g}
            </option>
          ))}
        </select>
      </Field>

      <Field label="Linked Service (optional)" error={errors.serviceSlug?.message}>
        <select {...register("serviceSlug")} className={selectClasses}>
          <option value="">— Spans all Classics services —</option>
          {SERVICE_SLUGS.map((s) => (
            <option key={s} value={s}>
              {s}
            </option>
          ))}
        </select>
      </Field>
      <Field label="Expires From" required error={errors.expiresFrom?.message}>
        <select {...register("expiresFrom")} className={selectClasses}>
          {EXPIRES_FROM.map((e) => (
            <option key={e} value={e}>
              {e}
            </option>
          ))}
        </select>
      </Field>

      <Field label="Entitlement" required error={errors.entitlementType?.message}>
        <select {...register("entitlementType")} className={selectClasses}>
          <option value="credits">Class credits</option>
          <option value="unlimited">Unlimited membership</option>
        </select>
      </Field>
      {entitlementType === "unlimited" && (
        <Field label="Membership Duration (months)" required error={errors.membershipDurationMonths?.message}>
          <input type="number" min="1" max="120" step="1" {...register("membershipDurationMonths")} className={fieldInputClasses} />
        </Field>
      )}

      <Field label="Price (₱)" required error={errors.price?.message}>
        <input type="number" step="0.01" min="0" {...register("price")} className={fieldInputClasses} />
      </Field>
      <Field label="Original Price (₱, optional)" error={errors.originalPrice?.message}>
        <input type="number" step="0.01" min="0" {...register("originalPrice")} className={fieldInputClasses} />
      </Field>

      <Field label="Credit Count (optional)" error={errors.creditCount?.message}>
        <input type="number" min="1" step="1" {...register("creditCount")} className={fieldInputClasses} />
      </Field>
      <Field label="Validity Days (optional)" error={errors.validityDays?.message}>
        <input type="number" min="1" step="1" {...register("validityDays")} className={fieldInputClasses} />
      </Field>

      <Field label="Validity Description" required error={errors.validityDescription?.message} className="sm:col-span-2">
        <input {...register("validityDescription")} className={fieldInputClasses} placeholder="60 days from purchase" />
      </Field>

      <Field label="Description" required error={errors.description?.message} className="sm:col-span-2">
        <textarea {...register("description")} rows={3} className={fieldInputClasses} />
      </Field>

      <Field label="Included Services (one per line)" error={errors.includedServices?.message} className="sm:col-span-2">
        <textarea {...register("includedServices")} rows={2} className={fieldInputClasses} />
      </Field>
      <Field label="Conditions (one per line)" error={errors.conditions?.message} className="sm:col-span-2">
        <textarea {...register("conditions")} rows={2} className={fieldInputClasses} />
      </Field>

      <label className="flex items-center gap-2 text-sm text-charcoal/70">
        <input type="checkbox" {...register("isRecommended")} className="h-4 w-4 accent-charcoal" />
        <span>Recommended (shows a highlight badge)</span>
      </label>
      {isRecommended && (
        <Field label="Recommended Label" error={errors.recommendedLabel?.message}>
          <input {...register("recommendedLabel")} className={fieldInputClasses} placeholder="Most Popular" />
        </Field>
      )}

      <label className="flex items-center gap-2 text-sm text-charcoal/70">
        <input type="checkbox" {...register("isFounderOffer")} className="h-4 w-4 accent-charcoal" />
        <span>Founding Member offer</span>
      </label>
      <label className="flex items-center gap-2 text-sm text-charcoal/70">
        <input type="checkbox" {...register("isActive")} className="h-4 w-4 accent-charcoal" />
        <span>Active (visible on /pricing)</span>
      </label>

      <Field label="Sort Order" required error={errors.sortOrder?.message}>
        <input type="number" step="1" {...register("sortOrder")} className={fieldInputClasses} />
      </Field>

      {serverError && <p className="text-sm text-red-600 sm:col-span-2">{serverError}</p>}

      <div className="flex gap-3 sm:col-span-2">
        <Button type="submit" disabled={submitting}>
          {submitting ? "Saving…" : packageId ? "Save Changes" : "Create Package"}
        </Button>
        <Button type="button" variant="secondary" onClick={() => router.push("/admin/packages")}>
          Cancel
        </Button>
      </div>
    </form>
  );
}
