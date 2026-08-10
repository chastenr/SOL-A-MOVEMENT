"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import {
  setClassTimeSlotActiveAction,
  setClassTimeSlotTemplateAction,
} from "@/app/admin/(protected)/classes/actions";
import { formatHourLabel } from "@/lib/studio-hours";
import { fieldInputClasses } from "@/components/ui/Field";

type Option = { id: string; name: string };

export function ClassTimeSlotRow({
  slot,
  classTypes,
  instructors,
}: {
  slot: {
    id: string;
    hour: number;
    isActive: boolean;
    classTypeId: string | null;
    instructorId: string | null;
    capacity: number;
    minimumParticipants: number | null;
  };
  classTypes: Option[];
  instructors: Option[];
}) {
  const router = useRouter();
  const [classTypeId, setClassTypeId] = useState(slot.classTypeId ?? "");
  const [instructorId, setInstructorId] = useState(slot.instructorId ?? "");
  const [capacity, setCapacity] = useState(String(slot.capacity));
  const [minimumParticipants, setMinimumParticipants] = useState(
    slot.minimumParticipants !== null ? String(slot.minimumParticipants) : ""
  );
  const [savingTemplate, setSavingTemplate] = useState(false);
  const [togglingOpen, setTogglingOpen] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [saved, setSaved] = useState(false);

  async function handleToggleOpen() {
    setTogglingOpen(true);
    setError(null);
    try {
      await setClassTimeSlotActiveAction(slot.id, !slot.isActive);
      router.refresh();
    } catch {
      // Without this, a failed toggle was a silent unhandled rejection: the
      // button just re-enabled with the label unchanged and no indication
      // anything went wrong — indistinguishable from "nothing happened."
      setError("Something went wrong. Please try again.");
    } finally {
      setTogglingOpen(false);
    }
  }

  async function handleSaveTemplate() {
    setSavingTemplate(true);
    setError(null);
    setSaved(false);
    try {
      const result = await setClassTimeSlotTemplateAction(slot.id, {
        classTypeId: classTypeId || null,
        instructorId: instructorId || null,
        capacity: Number(capacity),
        minimumParticipants: minimumParticipants ? Number(minimumParticipants) : null,
      });
      if ("error" in result) {
        setError(result.error);
        return;
      }
      setSaved(true);
      router.refresh();
    } catch {
      setError("Something went wrong. Please try again.");
    } finally {
      setSavingTemplate(false);
    }
  }

  return (
    <tr className="border-b border-charcoal/5 last:border-0">
      <td className="whitespace-nowrap px-3 py-2 text-sm text-charcoal">{formatHourLabel(slot.hour)}</td>
      <td className="px-3 py-2">
        <button
          type="button"
          onClick={handleToggleOpen}
          disabled={togglingOpen}
          className={
            slot.isActive
              ? "rounded-full bg-clay/10 px-2.5 py-1 text-xs text-clay underline-offset-2 hover:underline disabled:opacity-50"
              : "rounded-full bg-charcoal/10 px-2.5 py-1 text-xs text-charcoal/50 underline-offset-2 hover:underline disabled:opacity-50"
          }
        >
          {slot.isActive ? "Open" : "Closed"}
        </button>
      </td>
      <td className="min-w-[10rem] px-3 py-2">
        <select
          value={classTypeId}
          onChange={(event) => setClassTypeId(event.target.value)}
          className={`${fieldInputClasses} appearance-none py-1.5 text-sm`}
        >
          <option value="">— None —</option>
          {classTypes.map((option) => (
            <option key={option.id} value={option.id}>
              {option.name}
            </option>
          ))}
        </select>
      </td>
      <td className="min-w-[9rem] px-3 py-2">
        <select
          value={instructorId}
          onChange={(event) => setInstructorId(event.target.value)}
          className={`${fieldInputClasses} appearance-none py-1.5 text-sm`}
        >
          <option value="">— Unassigned —</option>
          {instructors.map((option) => (
            <option key={option.id} value={option.id}>
              {option.name}
            </option>
          ))}
        </select>
      </td>
      <td className="w-20 px-3 py-2">
        <input
          type="number"
          min={1}
          value={capacity}
          onChange={(event) => setCapacity(event.target.value)}
          className={`${fieldInputClasses} py-1.5 text-sm`}
        />
      </td>
      <td className="w-20 px-3 py-2">
        <input
          type="number"
          min={1}
          placeholder="—"
          value={minimumParticipants}
          onChange={(event) => setMinimumParticipants(event.target.value)}
          className={`${fieldInputClasses} py-1.5 text-sm`}
        />
      </td>
      <td className="px-3 py-2 text-right">
        <button
          type="button"
          onClick={handleSaveTemplate}
          disabled={savingTemplate}
          className="text-xs underline underline-offset-2 hover:text-charcoal disabled:opacity-50"
        >
          {savingTemplate ? "Saving…" : "Save"}
        </button>
        {saved && <p className="mt-1 text-[11px] text-clay">Saved</p>}
        {error && <p className="mt-1 text-[11px] text-red-600">{error}</p>}
      </td>
    </tr>
  );
}
