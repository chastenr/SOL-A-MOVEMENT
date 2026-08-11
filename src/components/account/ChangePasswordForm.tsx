"use client";

import { useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { changePasswordSchema, type ChangePasswordFormValues } from "@/lib/validations";
import { changePasswordAction } from "@/app/account/security/actions";
import { Button } from "@/components/ui/Button";
import { PasswordField } from "@/components/ui/PasswordField";

export function ChangePasswordForm() {
  const pathname = usePathname();
  const router = useRouter();
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
      if ("requiresMfa" in result) {
        router.push(`/mfa?redirectTo=${encodeURIComponent(pathname)}`);
        return;
      }
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
      <PasswordField
        label="Current Password"
        required
        error={errors.currentPassword?.message}
        registration={register("currentPassword")}
        autoComplete="current-password"
      />
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
      {error && <p className="text-sm text-red-600">{error}</p>}
      {saved && <p className="text-sm text-clay">Password updated.</p>}
      <Button type="submit" disabled={submitting} className="w-fit">
        {submitting ? "Updating…" : "Update Password"}
      </Button>
    </form>
  );
}
