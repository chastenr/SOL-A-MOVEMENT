"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { duplicateWeekAction } from "@/app/admin/(protected)/classes/actions";
import { fieldInputClasses } from "@/components/ui/Field";

function todayIso() {
  return new Date().toISOString().slice(0, 10);
}

/**
 * Copies every scheduled session starting from the chosen date through the
 * following 7 days into the week after that — a starting point for next
 * week's timetable, since coach schedules change weekly and there's no
 * recurring-schedule engine by design (see migration 0008 notes).
 */
export function DuplicateWeekForm() {
  const router = useRouter();
  const [weekStart, setWeekStart] = useState(todayIso());
  const [submitting, setSubmitting] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    if (!window.confirm("Duplicate this week's scheduled sessions into next week?")) return;

    setSubmitting(true);
    setMessage(null);
    try {
      const result = await duplicateWeekAction(`${weekStart}T00:00:00`);
      if ("error" in result) {
        setMessage(result.error);
        return;
      }
      setMessage("Next week's sessions were created. Edit coach/time as needed below.");
      router.refresh();
    } catch {
      setMessage("Something went wrong. Please try again.");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-wrap items-end gap-3">
      <label className="text-xs uppercase tracking-[0.1em] text-charcoal/50">
        Week starting
        <input
          type="date"
          value={weekStart}
          onChange={(event) => setWeekStart(event.target.value)}
          className={`${fieldInputClasses} mt-1 block`}
        />
      </label>
      <button
        type="submit"
        disabled={submitting}
        className="h-fit rounded-full border border-charcoal/15 px-4 py-2 text-xs uppercase tracking-[0.1em] text-charcoal/70 hover:border-charcoal/30 hover:text-charcoal disabled:opacity-50"
      >
        {submitting ? "Duplicating…" : "Duplicate → Next Week"}
      </button>
      {message && <p className="text-xs text-charcoal/60">{message}</p>}
    </form>
  );
}
