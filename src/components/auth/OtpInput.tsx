"use client";

import { useRef } from "react";

type OtpInputProps = {
  length?: number;
  value: string;
  onChange: (value: string) => void;
  disabled?: boolean;
  autoFocus?: boolean;
};

export function OtpInput({ length = 6, value, onChange, disabled, autoFocus }: OtpInputProps) {
  const inputsRef = useRef<(HTMLInputElement | null)[]>([]);

  function setDigit(index: number, digit: string) {
    const chars = value.padEnd(length, " ").split("");
    chars[index] = digit || " ";
    onChange(chars.join("").trimEnd());
  }

  function handleChange(index: number, raw: string) {
    const digits = raw.replace(/\D/g, "");
    if (digits.length > 1) {
      // Mobile SMS autofill or a paste landing in a single box.
      onChange(digits.slice(0, length));
      inputsRef.current[Math.min(digits.length, length - 1)]?.focus();
      return;
    }
    setDigit(index, digits);
    if (digits && index < length - 1) inputsRef.current[index + 1]?.focus();
  }

  function handleKeyDown(index: number, event: React.KeyboardEvent<HTMLInputElement>) {
    if (event.key === "Backspace" && !value[index] && index > 0) {
      inputsRef.current[index - 1]?.focus();
    } else if (event.key === "ArrowLeft" && index > 0) {
      inputsRef.current[index - 1]?.focus();
    } else if (event.key === "ArrowRight" && index < length - 1) {
      inputsRef.current[index + 1]?.focus();
    }
  }

  function handlePaste(event: React.ClipboardEvent<HTMLInputElement>) {
    const pasted = event.clipboardData.getData("text").replace(/\D/g, "").slice(0, length);
    if (!pasted) return;
    event.preventDefault();
    onChange(pasted);
    inputsRef.current[Math.min(pasted.length, length - 1)]?.focus();
  }

  return (
    <div className="flex justify-center gap-2 sm:gap-3" role="group" aria-label="Verification code">
      {Array.from({ length }).map((_, index) => (
        <input
          key={index}
          ref={(el) => {
            inputsRef.current[index] = el;
          }}
          type="text"
          inputMode="numeric"
          autoComplete={index === 0 ? "one-time-code" : "off"}
          pattern="\d*"
          maxLength={1}
          value={value[index] ?? ""}
          onChange={(event) => handleChange(index, event.target.value)}
          onKeyDown={(event) => handleKeyDown(index, event)}
          onPaste={handlePaste}
          disabled={disabled}
          autoFocus={autoFocus && index === 0}
          aria-label={`Digit ${index + 1} of ${length}`}
          className="h-12 w-10 rounded-xl border border-charcoal/15 bg-ivory text-center text-lg font-medium text-charcoal transition-colors focus:border-charcoal focus:outline-none disabled:opacity-50 sm:h-14 sm:w-12"
        />
      ))}
    </div>
  );
}
