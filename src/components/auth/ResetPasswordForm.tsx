"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { resetPasswordSchema, type ResetPasswordFormValues } from "@/lib/validations";
import { resetPasswordAction } from "@/lib/auth/actions";
import { Button } from "@/components/ui/Button";
import { PasswordField } from "@/components/ui/PasswordField";

export function ResetPasswordForm() {
  const router = useRouter();
  const [submitting, setSubmitting] = useState(false);
  const [serverError, setServerError] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<ResetPasswordFormValues>({
    resolver: zodResolver(resetPasswordSchema),
    defaultValues: { password: "", confirmPassword: "" },
  });

  async function onSubmit(values: ResetPasswordFormValues) {
    setSubmitting(true);
    setServerError(null);
    try {
      const result = await resetPasswordAction(values);
      if ("error" in result) {
        setServerError(result.error);
        return;
      }
      router.push("/account");
      router.refresh();
    } catch {
      setServerError("Something went wrong. Please try again.");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="grid gap-5">
      <PasswordField
        label="New Password"
        required
        error={errors.password?.message}
        registration={register("password")}
        autoComplete="new-password"
      />
      <PasswordField
        label="Confirm New Password"
        required
        error={errors.confirmPassword?.message}
        registration={register("confirmPassword")}
        autoComplete="new-password"
      />

      {serverError && <p className="text-sm text-red-600">{serverError}</p>}

      <Button type="submit" size="lg" disabled={submitting} className="w-full">
        {submitting ? "Updating…" : "Update Password"}
      </Button>
    </form>
  );
}
