"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { generateRecurringSessionsAction } from "@/app/admin/(protected)/classes/actions";
import { Button } from "@/components/ui/Button";

export function GenerateSessionsButton() {
  const router = useRouter();
  const [submitting, setSubmitting] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  async function handleClick() {
    setSubmitting(true);
    setMessage(null);
    try {
      const result = await generateRecurringSessionsAction();
      if ("error" in result) {
        setMessage(result.error);
        return;
      }
      setMessage(
        result.created > 0 ? `Created ${result.created} new session${result.created === 1 ? "" : "s"}.` : "Already up to date — nothing new to add."
      );
      router.refresh();
    } catch {
      setMessage("Something went wrong. Please try again.");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="flex items-center gap-3">
      <Button type="button" variant="secondary" size="md" onClick={handleClick} disabled={submitting}>
        {submitting ? "Generating…" : "Generate Now"}
      </Button>
      {message && <p className="text-xs text-charcoal/55">{message}</p>}
    </div>
  );
}
