"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { motion, AnimatePresence } from "framer-motion";
import { Mail } from "lucide-react";
import { forgotPasswordSchema, type ForgotPasswordFormValues } from "@/lib/validations";
import { forgotPasswordAction } from "@/lib/auth/actions";
import { Button } from "@/components/ui/Button";
import { Field, fieldInputClasses } from "@/components/ui/Field";

export function ForgotPasswordForm() {
  const [submitting, setSubmitting] = useState(false);
  const [serverError, setServerError] = useState<string | null>(null);
  const [sent, setSent] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<ForgotPasswordFormValues>({
    resolver: zodResolver(forgotPasswordSchema),
    defaultValues: { email: "" },
  });

  async function onSubmit(values: ForgotPasswordFormValues) {
    setSubmitting(true);
    setServerError(null);
    try {
      const result = await forgotPasswordAction(values);
      if ("error" in result) {
        setServerError(result.error);
        return;
      }
      setSent(true);
    } catch {
      setServerError("Something went wrong. Please try again.");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <AnimatePresence mode="wait">
      {sent ? (
        <motion.div
          key="sent"
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex flex-col items-center rounded-2xl border border-charcoal/10 bg-cream/40 px-8 py-16 text-center"
        >
          <span className="flex h-12 w-12 items-center justify-center rounded-full bg-charcoal text-ivory">
            <Mail size={20} aria-hidden />
          </span>
          <p className="font-display mt-6 text-2xl text-charcoal">Check your email.</p>
          <p className="mt-2 max-w-sm text-charcoal/65">
            If an account exists for that address, we&rsquo;ve sent a link to reset your password.
          </p>
        </motion.div>
      ) : (
        <motion.form key="form" initial={{ opacity: 0 }} animate={{ opacity: 1 }} onSubmit={handleSubmit(onSubmit)} className="grid gap-5">
          <Field label="Email" required error={errors.email?.message}>
            <input type="email" {...register("email")} className={fieldInputClasses} autoComplete="email" />
          </Field>

          {serverError && <p className="text-sm text-red-600">{serverError}</p>}

          <Button type="submit" size="lg" disabled={submitting} className="w-full">
            {submitting ? "Sending…" : "Send Reset Link"}
          </Button>
        </motion.form>
      )}
    </AnimatePresence>
  );
}
