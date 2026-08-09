"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { classSessionFormSchema, type ClassSessionFormValues } from "@/lib/validations";
import { createClassSessionAction } from "@/app/admin/(protected)/classes/actions";
import { Button } from "@/components/ui/Button";
import { Field, fieldInputClasses } from "@/components/ui/Field";

type Option = { id: string; name: string };

export function ClassSessionForm({
  classTypes,
  locations,
  instructors,
}: {
  classTypes: Option[];
  locations: Option[];
  instructors: Option[];
}) {
  const router = useRouter();
  const [submitting, setSubmitting] = useState(false);
  const [serverError, setServerError] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<ClassSessionFormValues>({
    resolver: zodResolver(classSessionFormSchema),
    defaultValues: {
      classTypeId: classTypes[0]?.id ?? "",
      locationId: locations[0]?.id ?? "",
      instructorId: "",
      startAt: "",
      durationMinutes: 50,
      capacity: 12,
      minimumParticipants: "",
    },
  });

  async function onSubmit(values: ClassSessionFormValues) {
    setSubmitting(true);
    setServerError(null);
    try {
      const result = await createClassSessionAction(values);
      if ("error" in result) {
        setServerError(result.error);
        return;
      }
      router.push("/admin/classes");
      router.refresh();
    } catch {
      setServerError("Something went wrong. Please try again.");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="grid gap-5 sm:grid-cols-2">
      <Field label="Class" required error={errors.classTypeId?.message}>
        <select {...register("classTypeId")} className={`${fieldInputClasses} appearance-none`}>
          {classTypes.map((option) => (
            <option key={option.id} value={option.id}>
              {option.name}
            </option>
          ))}
        </select>
      </Field>
      <Field label="Location" required error={errors.locationId?.message}>
        <select {...register("locationId")} className={`${fieldInputClasses} appearance-none`}>
          {locations.map((option) => (
            <option key={option.id} value={option.id}>
              {option.name}
            </option>
          ))}
        </select>
      </Field>

      <Field label="Instructor (optional)" error={errors.instructorId?.message}>
        <select {...register("instructorId")} className={`${fieldInputClasses} appearance-none`}>
          <option value="">— Unassigned —</option>
          {instructors.map((option) => (
            <option key={option.id} value={option.id}>
              {option.name}
            </option>
          ))}
        </select>
      </Field>
      <Field label="Start Time" required error={errors.startAt?.message}>
        <input type="datetime-local" {...register("startAt")} className={fieldInputClasses} />
      </Field>

      <Field label="Duration (minutes)" required error={errors.durationMinutes?.message}>
        <input type="number" step="5" {...register("durationMinutes")} className={fieldInputClasses} />
      </Field>
      <Field label="Capacity" required error={errors.capacity?.message}>
        <input type="number" step="1" {...register("capacity")} className={fieldInputClasses} />
      </Field>
      <Field
        label="Minimum Participants (optional)"
        error={errors.minimumParticipants?.message}
      >
        <input type="number" step="1" placeholder="No minimum" {...register("minimumParticipants")} className={fieldInputClasses} />
      </Field>

      {serverError && <p className="text-sm text-red-600 sm:col-span-2">{serverError}</p>}

      <div className="flex gap-3 sm:col-span-2">
        <Button type="submit" disabled={submitting}>
          {submitting ? "Scheduling…" : "Schedule Session"}
        </Button>
        <Button type="button" variant="secondary" onClick={() => router.push("/admin/classes")}>
          Cancel
        </Button>
      </div>
    </form>
  );
}
