"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { serviceFormSchema, type ServiceFormValues } from "@/lib/validations";
import { createServiceAction, updateServiceAction } from "@/app/admin/(protected)/services/actions";
import { Button } from "@/components/ui/Button";
import { Field, fieldInputClasses } from "@/components/ui/Field";

const SERVICE_SLUGS = ["mat-pilates", "yoga", "barre", "strength-hiit", "recovery-restore", "ballet"] as const;
const selectClasses = fieldInputClasses + " appearance-none";

export function ServiceForm({
  serviceId,
  defaultValues,
  lockSlug,
}: {
  serviceId?: string;
  defaultValues: ServiceFormValues;
  /** True when editing — the slug is also a Postgres enum tying this row to packages/class_types, so it isn't editable after creation. */
  lockSlug?: boolean;
}) {
  const router = useRouter();
  const [submitting, setSubmitting] = useState(false);
  const [serverError, setServerError] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<ServiceFormValues>({
    resolver: zodResolver(serviceFormSchema),
    defaultValues,
  });

  async function onSubmit(values: ServiceFormValues) {
    setSubmitting(true);
    setServerError(null);
    try {
      const result = serviceId
        ? await updateServiceAction(serviceId, values)
        : await createServiceAction(values);
      if ("error" in result) {
        setServerError(result.error);
        return;
      }
      router.push("/admin/services");
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
        <select {...register("slug")} className={selectClasses} disabled={lockSlug}>
          {SERVICE_SLUGS.map((s) => (
            <option key={s} value={s}>
              {s}
            </option>
          ))}
        </select>
      </Field>
      <Field label="Name" required error={errors.name?.message}>
        <input {...register("name")} className={fieldInputClasses} />
      </Field>

      <Field label="Category" required error={errors.category?.message}>
        <input {...register("category")} className={fieldInputClasses} />
      </Field>
      <Field label="Duration" required error={errors.duration?.message}>
        <input {...register("duration")} className={fieldInputClasses} placeholder="50 min" />
      </Field>

      <Field label="Level" required error={errors.level?.message}>
        <input {...register("level")} className={fieldInputClasses} placeholder="Open to all" />
      </Field>
      <Field label="Instructor (optional)" error={errors.instructor?.message}>
        <input {...register("instructor")} className={fieldInputClasses} />
      </Field>

      <Field label="Short Description" required error={errors.shortDescription?.message} className="sm:col-span-2">
        <textarea {...register("shortDescription")} rows={2} className={fieldInputClasses} />
      </Field>
      <Field label="Description" required error={errors.description?.message} className="sm:col-span-2">
        <textarea {...register("description")} rows={4} className={fieldInputClasses} />
      </Field>

      <Field label="Starting Price (optional, display text)" error={errors.startingPrice?.message}>
        <input {...register("startingPrice")} className={fieldInputClasses} placeholder="₱850 for a single class" />
      </Field>
      <Field label="Class Variants (one per line, optional)" error={errors.classVariants?.message}>
        <textarea {...register("classVariants")} rows={2} className={fieldInputClasses} />
      </Field>

      <Field label="Image URL" required error={errors.imageSrc?.message} className="sm:col-span-2">
        <input {...register("imageSrc")} className={fieldInputClasses} />
        <p className="mt-1 text-xs text-charcoal/45">
          Must be hosted on an already-configured domain (images.pexels.com, images.unsplash.com,
          upload.wikimedia.org or ik.imagekit.io). Use the original image URL—not a thumbnail—with
          at least 2400px on its longest edge.
        </p>
      </Field>
      <Field label="Image Alt Text" required error={errors.imageAlt?.message} className="sm:col-span-2">
        <input {...register("imageAlt")} className={fieldInputClasses} />
      </Field>

      <label className="flex items-center gap-2 text-sm text-charcoal/70">
        <input type="checkbox" {...register("isActive")} className="h-4 w-4 accent-charcoal" />
        <span>Active (visible on /services)</span>
      </label>
      <Field label="Sort Order" required error={errors.sortOrder?.message}>
        <input type="number" step="1" {...register("sortOrder")} className={fieldInputClasses} />
      </Field>

      {serverError && <p className="text-sm text-red-600 sm:col-span-2">{serverError}</p>}

      <div className="flex gap-3 sm:col-span-2">
        <Button type="submit" disabled={submitting}>
          {submitting ? "Saving…" : serviceId ? "Save Changes" : "Create Service"}
        </Button>
        <Button type="button" variant="secondary" onClick={() => router.push("/admin/services")}>
          Cancel
        </Button>
      </div>
    </form>
  );
}
