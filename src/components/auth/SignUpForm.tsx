"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { motion, AnimatePresence } from "framer-motion";
import { Mail } from "lucide-react";
import { signUpSchema, type SignUpFormValues } from "@/lib/validations";
import { signUpAction } from "@/lib/auth/actions";
import { Button } from "@/components/ui/Button";
import { Field, fieldInputClasses } from "@/components/ui/Field";
import { PasswordField } from "@/components/ui/PasswordField";
import { PoliciesModal } from "@/components/auth/PoliciesModal";

export function SignUpForm({ redirectTo }: { redirectTo?: string }) {
  const router = useRouter();
  const [submitting, setSubmitting] = useState(false);
  const [serverError, setServerError] = useState<string | null>(null);
  const [awaitingVerification, setAwaitingVerification] = useState<string | null>(null);
  const [showPolicies, setShowPolicies] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<SignUpFormValues>({
    resolver: zodResolver(signUpSchema),
    defaultValues: {
      firstName: "",
      lastName: "",
      email: "",
      mobileNumber: "",
      birthday: "",
      password: "",
      confirmPassword: "",
      consent: false,
    },
  });

  async function onSubmit(values: SignUpFormValues) {
    setSubmitting(true);
    setServerError(null);
    try {
      const result = await signUpAction(values, redirectTo);
      if ("error" in result) {
        setServerError(result.error);
        return;
      }
      if (result.needsEmailConfirmation) {
        setAwaitingVerification(values.email);
      } else {
        router.push(redirectTo && redirectTo.startsWith("/") ? redirectTo : "/account");
        router.refresh();
      }
    } catch {
      setServerError("Something went wrong. Please try again.");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <>
      <AnimatePresence mode="wait">
        {awaitingVerification ? (
          <motion.div
            key="verify"
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            className="flex flex-col items-center rounded-2xl border border-charcoal/10 bg-cream/40 px-8 py-16 text-center"
          >
            <span className="flex h-12 w-12 items-center justify-center rounded-full bg-charcoal text-ivory">
              <Mail size={20} aria-hidden />
            </span>
            <p className="font-display mt-6 text-2xl text-charcoal">Check your email.</p>
            <p className="mt-2 max-w-sm text-charcoal/65">
              We sent a verification link to <span className="text-charcoal">{awaitingVerification}</span>. Click
              it to activate your account, then sign in.
            </p>
            <Button
              href={redirectTo ? `/login?redirectTo=${encodeURIComponent(redirectTo)}` : "/login"}
              variant="secondary"
              className="mt-8"
            >
              Go to Sign In
            </Button>
          </motion.div>
        ) : (
          <motion.form key="form" initial={{ opacity: 0 }} animate={{ opacity: 1 }} onSubmit={handleSubmit(onSubmit)} className="grid gap-5 sm:grid-cols-2">
            <Field label="First Name" required error={errors.firstName?.message}>
              <input {...register("firstName")} className={fieldInputClasses} autoComplete="given-name" />
            </Field>
            <Field label="Last Name" required error={errors.lastName?.message}>
              <input {...register("lastName")} className={fieldInputClasses} autoComplete="family-name" />
            </Field>
            <Field label="Email" required error={errors.email?.message} className="sm:col-span-2">
              <input type="email" {...register("email")} className={fieldInputClasses} autoComplete="email" />
            </Field>
            <Field label="Mobile Number" required error={errors.mobileNumber?.message}>
              <input type="tel" {...register("mobileNumber")} className={fieldInputClasses} autoComplete="tel" />
            </Field>
            <Field label="Birthday" error={errors.birthday?.message}>
              <input type="date" {...register("birthday")} className={fieldInputClasses} autoComplete="bday" />
            </Field>
            <PasswordField label="Password" required error={errors.password?.message} registration={register("password")} autoComplete="new-password" />
            <PasswordField
              label="Confirm Password"
              required
              error={errors.confirmPassword?.message}
              registration={register("confirmPassword")}
              autoComplete="new-password"
            />

            <div className="sm:col-span-2">
              <label className="flex items-start gap-2.5 text-sm text-charcoal/70">
                <input type="checkbox" {...register("consent")} className="mt-0.5 h-4 w-4 shrink-0 accent-charcoal" />
                <span>
                  I agree to Veora Wellness&rsquo;s{" "}
                  <button
                    type="button"
                    onClick={() => setShowPolicies(true)}
                    className="underline underline-offset-2 hover:text-charcoal"
                  >
                    Terms and Privacy Policy
                  </button>
                  .
                </span>
              </label>
              {errors.consent && <p className="mt-1.5 text-sm text-red-600">{errors.consent.message}</p>}
            </div>

            {serverError && <p className="text-sm text-red-600 sm:col-span-2">{serverError}</p>}

            <div className="sm:col-span-2">
              <Button type="submit" size="lg" disabled={submitting} className="w-full sm:w-auto">
                {submitting ? "Creating account…" : "Create Account"}
              </Button>
            </div>
          </motion.form>
        )}
      </AnimatePresence>
      {showPolicies && <PoliciesModal onClose={() => setShowPolicies(false)} />}
    </>
  );
}
