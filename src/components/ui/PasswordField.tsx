"use client";

import { useState } from "react";
import type { UseFormRegisterReturn } from "react-hook-form";
import { Eye, EyeOff } from "lucide-react";
import { Field, fieldInputClasses } from "@/components/ui/Field";
import { cn } from "@/lib/utils";

export function PasswordField({
  label,
  required,
  error,
  registration,
  autoComplete,
  className,
}: {
  label: string;
  required?: boolean;
  error?: string;
  registration: UseFormRegisterReturn;
  autoComplete?: string;
  className?: string;
}) {
  const [visible, setVisible] = useState(false);

  return (
    <Field label={label} required={required} error={error} className={className}>
      <div className="relative">
        <input
          type={visible ? "text" : "password"}
          {...registration}
          autoComplete={autoComplete}
          className={cn(fieldInputClasses, "pr-11")}
        />
        <button
          type="button"
          onClick={() => setVisible((current) => !current)}
          // Not a real form control (doesn't submit/tab into the value) and
          // shouldn't steal tab order between the password fields and Submit.
          tabIndex={-1}
          aria-label={visible ? "Hide password" : "Show password"}
          className="absolute inset-y-0 right-0 flex items-center px-3.5 text-charcoal/40 hover:text-charcoal"
        >
          {visible ? <EyeOff size={17} aria-hidden /> : <Eye size={17} aria-hidden />}
        </button>
      </div>
    </Field>
  );
}
