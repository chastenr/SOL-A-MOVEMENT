"use client";

import { motion } from "framer-motion";
import { cn } from "@/lib/utils";

export const BOOKING_STEPS = ["Service", "Date & Time", "Your Details", "Confirmation"] as const;

export function BookingProgress({ currentStep }: { currentStep: number }) {
  const progress = ((currentStep - 1) / (BOOKING_STEPS.length - 1)) * 100;

  return (
    <div>
      <div className="flex items-center justify-between text-xs uppercase tracking-[0.14em] text-charcoal/50 sm:hidden">
        <span>
          Step {currentStep} of {BOOKING_STEPS.length}
        </span>
        <span className="text-charcoal">{BOOKING_STEPS[currentStep - 1]}</span>
      </div>
      <div className="mt-3 h-px w-full bg-charcoal/10 sm:hidden">
        <motion.div
          className="h-px bg-clay"
          animate={{ width: `${progress}%` }}
          transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
        />
      </div>

      <ol className="hidden items-center sm:flex">
        {BOOKING_STEPS.map((label, index) => {
          const stepNumber = index + 1;
          const isComplete = stepNumber < currentStep;
          const isActive = stepNumber === currentStep;

          return (
            <li key={label} className="flex flex-1 items-center last:flex-none">
              <div className="flex flex-col items-center gap-2 text-center">
                <span
                  className={cn(
                    "flex h-9 w-9 items-center justify-center rounded-full border text-sm transition-colors duration-300",
                    isActive && "border-charcoal bg-charcoal text-ivory",
                    isComplete && "border-clay bg-clay text-ivory",
                    !isActive && !isComplete && "border-charcoal/20 text-charcoal/40"
                  )}
                >
                  {stepNumber}
                </span>
                <span
                  className={cn(
                    "text-xs uppercase tracking-[0.1em] whitespace-nowrap",
                    isActive ? "text-charcoal" : "text-charcoal/40"
                  )}
                >
                  {label}
                </span>
              </div>
              {stepNumber < BOOKING_STEPS.length && (
                <div className="mx-3 h-px flex-1 bg-charcoal/10">
                  <motion.div
                    className="h-px bg-clay"
                    animate={{ width: isComplete ? "100%" : "0%" }}
                    transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
                  />
                </div>
              )}
            </li>
          );
        })}
      </ol>
    </div>
  );
}
