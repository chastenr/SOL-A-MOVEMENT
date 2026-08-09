"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { changePasswordSchema, type ChangePasswordFormValues } from "@/lib/validations";
import { changePasswordAction } from "@/app/account/security/actions";
import { Button } from "@/components/ui/Button";
import { Field, fieldInputClasses } from "@/components/ui/Field";

export function ChangePasswordForm() {
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [saved, setSaved] = useState(false);

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<ChangePasswordFormValues>({
    resolver: zodResolver(changePasswordSchema),
    defaultValues: { currentPassword: "", password: "", confirmPassword: "" },
  });

  async function onSubmit(values: ChangePasswordFormValues) {
    setSubmitting(true);
    setError(null);
    setSaved(false);
    try {
      const result = await changePasswordAction(values);
      if ("error" in result) {
        setError(result.error);
        return;
      }
      setSaved(true);
      reset();
    } catch {
      setError("Something went wrong. Please try again.");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="grid max-w-sm gap-4">
      <Field label="Current Password" required error={errors.currentPassword?.message}>
        <input type="password" {...register("currentPassword")} className={fieldInputClasses} autoComplete="current-password" />
      </Field>
      <Field label="New Password" required error={errors.password?.message}>
        <input type="password" {...register("password")} className={fieldInputClasses} autoComplete="new-password" />
      </Field>
      <Field label="Confirm New Password" required error={errors.confirmPassword?.message}>
        <input type="password" {...register("confirmPassword")} className={fieldInputClasses} autoComplete="new-password" />
      </Field>
      {error && <p className="text-sm text-red-600">{error}</p>}
      {saved && <p className="text-sm text-clay">Password updated.</p>}
      <Button type="submit" disabled={submitting} className="w-fit">
        {submitting ? "Updating…" : "Update Password"}
      </Button>
    </form>
  );
}
