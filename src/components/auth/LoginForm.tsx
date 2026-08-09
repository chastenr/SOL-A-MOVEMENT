"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { loginSchema, type LoginFormValues } from "@/lib/validations";
import { loginAction } from "@/lib/auth/actions";
import { Button } from "@/components/ui/Button";
import { Field, fieldInputClasses } from "@/components/ui/Field";
import { PasswordField } from "@/components/ui/PasswordField";

export function LoginForm({ redirectTo }: { redirectTo?: string }) {
  const router = useRouter();
  const [submitting, setSubmitting] = useState(false);
  const [serverError, setServerError] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<LoginFormValues>({
    resolver: zodResolver(loginSchema),
    defaultValues: { email: "", password: "" },
  });

  async function onSubmit(values: LoginFormValues) {
    setSubmitting(true);
    setServerError(null);
    try {
      const result = await loginAction(values);
      if ("error" in result) {
        setServerError(result.error);
        return;
      }
      router.push(redirectTo && redirectTo.startsWith("/") ? redirectTo : "/account");
      router.refresh();
    } catch {
      setServerError("Something went wrong. Please try again.");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="grid gap-5">
      <Field label="Email" required error={errors.email?.message}>
        <input type="email" {...register("email")} className={fieldInputClasses} autoComplete="email" />
      </Field>
      <PasswordField
        label="Password"
        required
        error={errors.password?.message}
        registration={register("password")}
        autoComplete="current-password"
      />

      <div className="flex justify-end">
        <Link href="/forgot-password" className="text-xs uppercase tracking-[0.1em] text-charcoal/50 underline underline-offset-2 hover:text-charcoal">
          Forgot password?
        </Link>
      </div>

      {serverError && <p className="text-sm text-red-600">{serverError}</p>}

      <Button type="submit" size="lg" disabled={submitting} className="w-full">
        {submitting ? "Signing in…" : "Sign In"}
      </Button>
    </form>
  );
}
