"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { AnimatePresence, motion } from "framer-motion";
import { bookingSchema, type BookingFormValues } from "@/lib/validations";
import { BookingProgress } from "@/components/booking/BookingProgress";
import { ServiceSelector } from "@/components/booking/ServiceSelector";
import { BookingDateTimeStep } from "@/components/booking/BookingDateTimeStep";
import { BookingForm } from "@/components/booking/BookingForm";
import { BookingReview } from "@/components/booking/BookingReview";
import { BookingConfirmation } from "@/components/booking/BookingConfirmation";

type BookingFlowProps = {
  initialService?: string;
  initialDate?: string;
  initialTime?: string;
};

const EASE = [0.16, 1, 0.3, 1] as const;

export function BookingFlow({ initialService, initialDate, initialTime }: BookingFlowProps) {
  const [step, setStep] = useState(1);
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [confirmedBooking, setConfirmedBooking] = useState<BookingFormValues | null>(null);

  const form = useForm<BookingFormValues>({
    resolver: zodResolver(bookingSchema),
    defaultValues: {
      service: initialService ?? "",
      date: initialDate ?? "",
      time: initialTime ?? "",
      firstName: "",
      lastName: "",
      email: "",
      phone: "",
      notes: "",
      consent: false,
    },
  });

  const serviceValue = form.watch("service");
  const dateValue = form.watch("date");
  const timeValue = form.watch("time");

  async function handleConfirm() {
    setSubmitting(true);
    setSubmitError(null);
    const values = form.getValues();

    try {
      const response = await fetch("/api/book", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(values),
      });
      const data = await response.json();

      if (!response.ok) {
        setSubmitError(
          data.message || "Something went wrong while booking your session. Please try again."
        );
        return;
      }

      setConfirmedBooking(values);
    } catch {
      setSubmitError("Something went wrong while booking your session. Please try again.");
    } finally {
      setSubmitting(false);
    }
  }

  function handleBookAnother() {
    form.reset({
      service: "",
      date: "",
      time: "",
      firstName: "",
      lastName: "",
      email: "",
      phone: "",
      notes: "",
      consent: false,
    });
    setConfirmedBooking(null);
    setSubmitError(null);
    setStep(1);
  }

  if (confirmedBooking) {
    return <BookingConfirmation booking={confirmedBooking} onBookAnother={handleBookAnother} />;
  }

  return (
    <div>
      <BookingProgress currentStep={step} />

      <div className="mt-10 sm:mt-14">
        <AnimatePresence mode="wait">
          <motion.div
            key={step}
            initial={{ opacity: 0, x: 16 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -16 }}
            transition={{ duration: 0.35, ease: EASE }}
          >
            {step === 1 && (
              <ServiceSelector
                value={serviceValue}
                onSelect={(slug) => form.setValue("service", slug, { shouldValidate: true })}
                onContinue={() => setStep(2)}
              />
            )}

            {step === 2 && (
              <BookingDateTimeStep
                date={dateValue}
                time={timeValue}
                onSelectDate={(date) => form.setValue("date", date, { shouldValidate: true })}
                onSelectTime={(time) => form.setValue("time", time, { shouldValidate: true })}
                onContinue={() => setStep(3)}
                onBack={() => setStep(1)}
              />
            )}

            {step === 3 && (
              <BookingForm
                form={form}
                onContinue={async () => {
                  const valid = await form.trigger([
                    "firstName",
                    "lastName",
                    "email",
                    "phone",
                    "notes",
                    "consent",
                  ]);
                  if (valid) setStep(4);
                }}
                onBack={() => setStep(2)}
              />
            )}

            {step === 4 && (
              <BookingReview
                values={form.getValues()}
                onBack={() => setStep(3)}
                onConfirm={handleConfirm}
                submitting={submitting}
                error={submitError}
              />
            )}
          </motion.div>
        </AnimatePresence>
      </div>
    </div>
  );
}
