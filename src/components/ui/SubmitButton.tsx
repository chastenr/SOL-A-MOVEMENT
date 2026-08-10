"use client";

import { useFormStatus } from "react-dom";
import { cn } from "@/lib/utils";

/**
 * Drop-in replacement for a plain `<button type="submit">` inside a Server
 * Action `<form>`. Shows a disabled, pending state during the round-trip
 * instead of sitting there looking unresponsive — that "did this even
 * register?" gap is what leads to a second click, and for actions like
 * completing/cancelling a booking, a second click on an already-actioned row
 * throws (see (protected)/error.tsx).
 */
export function SubmitButton({
  children,
  pendingLabel,
  className,
}: {
  children: React.ReactNode;
  pendingLabel?: string;
  className?: string;
}) {
  const { pending } = useFormStatus();
  return (
    <button type="submit" disabled={pending} className={cn("disabled:cursor-not-allowed disabled:opacity-50", className)}>
      {pending ? (pendingLabel ?? "…") : children}
    </button>
  );
}
