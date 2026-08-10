"use client";

import { useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { changeEmailSchema, type ChangeEmailFormValues } from "@/lib/validations";
import { changeEmailAction } from "@/app/account/security/actions";
import { Button } from "@/components/ui/Button";
import { Field, fieldInputClasses } from "@/components/ui/Field";

export function ChangeEmailForm({ currentEmail }: { currentEmail: string }) {
  const pathname = usePathname();
  const router = useRouter();
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [sent, setSent] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<ChangeEmailFormValues>({
    resolver: zodResolver(changeEmailSchema),
    defaultValues: { email: "" },
  });

  async function onSubmit(values: ChangeEmailFormValues) {
    setSubmitting(true);
    setError(null);
    setSent(false);
    try {
      const result = await changeEmailAction(values);
      if ("requiresMfa" in result) {
        router.push(`/admin/mfa?redirectTo=${encodeURIComponent(pathname)}`);
        return;
      }
      if ("error" in result) {
        setError(result.error);
        return;
      }
      setSent(true);
    } catch {
      setError("Something went wrong. Please try again.");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="grid max-w-sm gap-4">
      <p className="text-sm text-charcoal/55">Current: {currentEmail}</p>
      <Field label="New Email Address" required error={errors.email?.message}>
        <input type="email" {...register("email")} className={fieldInputClasses} autoComplete="email" />
      </Field>
      {error && <p className="text-sm text-red-600">{error}</p>}
      {sent && (
        <p className="text-sm text-clay">
          Check your new inbox for a confirmation link — the change won&rsquo;t take effect until you click it.
        </p>
      )}
      <Button type="submit" disabled={submitting} className="w-fit">
        {submitting ? "Sending…" : "Send Confirmation"}
      </Button>
    </form>
  );
}
