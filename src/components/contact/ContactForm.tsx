"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { motion, AnimatePresence } from "framer-motion";
import { Check } from "lucide-react";
import { contactSchema, type ContactFormValues } from "@/lib/validations";
import { Button } from "@/components/ui/Button";
import { cn } from "@/lib/utils";

const TOPICS = [
  "General Question",
  "Booking Question",
  "Studio Rental",
  "Press or Partnership",
  "Other",
];

const inputClasses =
  "w-full rounded-xl border border-charcoal/15 bg-ivory px-4 py-3 text-sm text-charcoal placeholder:text-charcoal/35 transition-colors focus:border-charcoal focus:outline-none";

export function ContactForm() {
  const [submitted, setSubmitted] = useState(false);
  const [serverError, setServerError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
    reset,
  } = useForm<ContactFormValues>({
    resolver: zodResolver(contactSchema),
    defaultValues: {
      firstName: "",
      lastName: "",
      email: "",
      phone: "",
      topic: "",
      message: "",
    },
  });

  async function onSubmit(values: ContactFormValues) {
    setSubmitting(true);
    setServerError(null);
    try {
      const response = await fetch("/api/contact", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(values),
      });
      if (!response.ok) {
        const data = await response.json().catch(() => null);
        setServerError(data?.message || "Something went wrong. Please try again.");
        return;
      }
      setSubmitted(true);
      reset();
    } catch {
      setServerError("Something went wrong. Please try again.");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <AnimatePresence mode="wait">
      {submitted ? (
        <motion.div
          key="success"
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex flex-col items-center rounded-2xl border border-charcoal/10 bg-cream/40 px-8 py-16 text-center"
        >
          <span className="flex h-12 w-12 items-center justify-center rounded-full bg-charcoal text-ivory">
            <Check size={22} />
          </span>
          <p className="font-display mt-6 text-2xl text-charcoal">Message sent.</p>
          <p className="mt-2 max-w-sm text-charcoal/65">
            Thank you for reaching out. We&rsquo;ll get back to you as soon as we can.
          </p>
          <Button type="button" variant="secondary" className="mt-8" onClick={() => setSubmitted(false)}>
            Send another message
          </Button>
        </motion.div>
      ) : (
        <motion.form
          key="form"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          onSubmit={handleSubmit(onSubmit)}
          className="grid gap-5 sm:grid-cols-2"
        >
          <Field label="First Name" required error={errors.firstName?.message}>
            <input {...register("firstName")} className={inputClasses} autoComplete="given-name" />
          </Field>
          <Field label="Last Name" required error={errors.lastName?.message}>
            <input {...register("lastName")} className={inputClasses} autoComplete="family-name" />
          </Field>
          <Field label="Email" required error={errors.email?.message}>
            <input type="email" {...register("email")} className={inputClasses} autoComplete="email" />
          </Field>
          <Field label="Phone" error={errors.phone?.message}>
            <input type="tel" {...register("phone")} className={inputClasses} autoComplete="tel" />
          </Field>
          <Field label="Topic" required error={errors.topic?.message} className="sm:col-span-2">
            <select {...register("topic")} className={cn(inputClasses, "appearance-none")} defaultValue="">
              <option value="" disabled>
                Select a topic
              </option>
              {TOPICS.map((topic) => (
                <option key={topic} value={topic}>
                  {topic}
                </option>
              ))}
            </select>
          </Field>
          <Field label="Message" required error={errors.message?.message} className="sm:col-span-2">
            <textarea {...register("message")} rows={5} className={cn(inputClasses, "resize-none")} />
          </Field>

          {serverError && (
            <p className="text-sm text-red-600 sm:col-span-2">{serverError}</p>
          )}

          <div className="sm:col-span-2">
            <Button type="submit" size="lg" disabled={submitting}>
              {submitting ? "Sending…" : "Send Message"}
            </Button>
          </div>
        </motion.form>
      )}
    </AnimatePresence>
  );
}

function Field({
  label,
  required,
  error,
  children,
  className,
}: {
  label: string;
  required?: boolean;
  error?: string;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <div className={className}>
      <label className="mb-1.5 block text-xs uppercase tracking-[0.1em] text-charcoal/50">
        {label}
        {required && <span className="text-clay"> *</span>}
      </label>
      {children}
      {error && <p className="mt-1.5 text-sm text-red-600">{error}</p>}
    </div>
  );
}
