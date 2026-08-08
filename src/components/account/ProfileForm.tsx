"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { updateProfileAction, type ProfileFormValues } from "@/app/account/profile/actions";
import { Button } from "@/components/ui/Button";
import { Field, fieldInputClasses } from "@/components/ui/Field";

export function ProfileForm({ defaultValues }: { defaultValues: ProfileFormValues }) {
  const router = useRouter();
  const [submitting, setSubmitting] = useState(false);
  const [serverError, setServerError] = useState<string | null>(null);
  const [saved, setSaved] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<ProfileFormValues>({ defaultValues });

  async function onSubmit(values: ProfileFormValues) {
    setSubmitting(true);
    setServerError(null);
    setSaved(false);
    try {
      const result = await updateProfileAction(values);
      if ("error" in result) {
        setServerError(result.error);
        return;
      }
      setSaved(true);
      router.refresh();
    } catch {
      setServerError("Something went wrong. Please try again.");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="grid max-w-lg gap-5">
      <div className="grid gap-5 sm:grid-cols-2">
        <Field label="First Name" required error={errors.firstName?.message}>
          <input {...register("firstName")} className={fieldInputClasses} />
        </Field>
        <Field label="Last Name" required error={errors.lastName?.message}>
          <input {...register("lastName")} className={fieldInputClasses} />
        </Field>
      </div>
      <Field label="Mobile Number" required error={errors.mobileNumber?.message}>
        <input type="tel" {...register("mobileNumber")} className={fieldInputClasses} />
      </Field>
      <Field label="Birthday" error={errors.birthday?.message}>
        <input type="date" {...register("birthday")} className={fieldInputClasses} />
      </Field>

      {serverError && <p className="text-sm text-red-600">{serverError}</p>}
      {saved && <p className="text-sm text-clay">Saved.</p>}

      <Button type="submit" disabled={submitting} className="w-fit">
        {submitting ? "Saving…" : "Save Changes"}
      </Button>
    </form>
  );
}
