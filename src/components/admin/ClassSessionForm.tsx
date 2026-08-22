"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { useForm, useWatch } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { classSessionFormSchema, type ClassSessionFormValues } from "@/lib/validations";
import { createClassSessionAction, updateClassSessionAction } from "@/app/admin/(protected)/classes/actions";
import { CLASS_DURATION_MINUTES, formatHourLabel, getWeekdayFromDateInput } from "@/lib/studio-hours";
import { Button } from "@/components/ui/Button";
import { Field, fieldInputClasses } from "@/components/ui/Field";

type Option = { id: string; name: string };
type ClassTypeOption = Option & { serviceSlug: string };
type TimeSlot = { locationId: string; weekday: number; hour: number; isActive: boolean };
type EditTarget = { id: string; bookedCount: number; initialValues: ClassSessionFormValues };

const BALLET_SERVICE_SLUG = "ballet";

export function ClassSessionForm({
  classTypes,
  locations,
  instructors,
  timeSlots,
  editing,
}: {
  classTypes: ClassTypeOption[];
  locations: Option[];
  instructors: Option[];
  timeSlots: TimeSlot[];
  editing?: EditTarget;
}) {
  const router = useRouter();
  const [submitting, setSubmitting] = useState(false);
  const [serverError, setServerError] = useState<string | null>(null);
  const [date, setDate] = useState(() => editing?.initialValues.startAt.slice(0, 10) ?? "");
  const [hour, setHour] = useState<number | "">(() => {
    const startAt = editing?.initialValues.startAt;
    return startAt ? Number(startAt.slice(11, 13)) : "";
  });

  const {
    register,
    handleSubmit,
    control,
    setValue,
    formState: { errors },
  } = useForm<ClassSessionFormValues>({
    resolver: zodResolver(classSessionFormSchema),
    defaultValues: editing?.initialValues ?? {
      classTypeId: classTypes[0]?.id ?? "",
      locationId: locations[0]?.id ?? "",
      instructorId: "",
      startAt: "",
      durationMinutes: CLASS_DURATION_MINUTES,
      capacity: 20,
      minimumParticipants: "",
    },
  });

  const selectedClassTypeId = useWatch({ control, name: "classTypeId" });
  const selectedLocationId = useWatch({ control, name: "locationId" });
  const selectedClassType = classTypes.find((option) => option.id === selectedClassTypeId);
  // Ballet keeps a free-typed start time + duration (60/90 min); every other
  // class type is fixed at 50 minutes, on the hour — see studio-hours.ts.
  const isFixedSchedule = selectedClassType?.serviceSlug !== BALLET_SERVICE_SLUG;

  const selectedWeekday = getWeekdayFromDateInput(date);
  const openHours = useMemo(
    () =>
      [...new Set(
        timeSlots
          .filter(
            (slot) =>
              slot.locationId === selectedLocationId &&
              slot.weekday === selectedWeekday &&
              slot.isActive
          )
          .map((slot) => slot.hour)
      )].sort((a, b) => a - b),
    [selectedLocationId, selectedWeekday, timeSlots]
  );
  const selectedHour = hour !== "" && openHours.includes(Number(hour)) ? hour : "";

  useEffect(() => {
    if (!isFixedSchedule) return;
    setValue("durationMinutes", CLASS_DURATION_MINUTES);
  }, [isFixedSchedule, setValue]);

  useEffect(() => {
    if (!isFixedSchedule) return;
    setValue(
      "startAt",
      date && selectedHour !== "" ? `${date}T${String(selectedHour).padStart(2, "0")}:00` : "",
      { shouldValidate: date !== "" && selectedHour !== "" }
    );
  }, [isFixedSchedule, date, selectedHour, setValue]);

  async function onSubmit(values: ClassSessionFormValues) {
    setSubmitting(true);
    setServerError(null);
    try {
      const result = editing
        ? await updateClassSessionAction(editing.id, values)
        : await createClassSessionAction(values);
      if ("error" in result) {
        setServerError(result.error);
        return;
      }
      router.push("/admin/classes");
      router.refresh();
    } catch {
      setServerError("Something went wrong. Please try again.");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="grid gap-5 sm:grid-cols-2">
      {editing && editing.bookedCount > 0 && (
        <p className="rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800 sm:col-span-2">
          {editing.bookedCount} customer{editing.bookedCount === 1 ? " is" : "s are"} already booked into this
          class. Changing the coach or time here won&rsquo;t automatically notify them — capacity also can&rsquo;t
          go below {editing.bookedCount}.
        </p>
      )}
      <Field label="Class" required error={errors.classTypeId?.message}>
        <select {...register("classTypeId")} className={`${fieldInputClasses} appearance-none`}>
          {classTypes.map((option) => (
            <option key={option.id} value={option.id}>
              {option.name}
            </option>
          ))}
        </select>
      </Field>
      <Field label="Location" required error={errors.locationId?.message}>
        <select {...register("locationId")} className={`${fieldInputClasses} appearance-none`}>
          {locations.map((option) => (
            <option key={option.id} value={option.id}>
              {option.name}
            </option>
          ))}
        </select>
      </Field>

      <Field label="Instructor (optional)" error={errors.instructorId?.message}>
        <select {...register("instructorId")} className={`${fieldInputClasses} appearance-none`}>
          <option value="">— Unassigned —</option>
          {instructors.map((option) => (
            <option key={option.id} value={option.id}>
              {option.name}
            </option>
          ))}
        </select>
      </Field>

      {isFixedSchedule ? (
        <>
          <input type="hidden" {...register("startAt")} />
          <input type="hidden" {...register("durationMinutes")} />
          <Field label="Date" required error={errors.startAt?.message}>
            <input
              type="date"
              value={date}
              onChange={(event) => setDate(event.target.value)}
              className={fieldInputClasses}
            />
          </Field>
          <Field label="Start Time" required>
            <select
              value={selectedHour}
              onChange={(event) => setHour(event.target.value === "" ? "" : Number(event.target.value))}
              disabled={selectedWeekday === null || openHours.length === 0}
              className={`${fieldInputClasses} appearance-none`}
            >
              <option value="">— Select an hour —</option>
              {openHours.map((openHour) => (
                <option key={openHour} value={openHour}>
                  {formatHourLabel(openHour)}
                </option>
              ))}
            </select>
            <p className="mt-1 text-xs text-charcoal/40">
              {selectedWeekday === null
                ? "Select a date first to see that day's available hours."
                : openHours.length === 0
                ? "No hours are open for this location yet — enable some under Class Times."
                : "Fixed at 50 minutes, back-to-back on the hour — customers should arrive 10 minutes early."}
            </p>
          </Field>
          <Field label="Duration">
            <p className={`${fieldInputClasses} bg-charcoal/5 text-charcoal/60`}>50 minutes (fixed)</p>
          </Field>
        </>
      ) : (
        <>
          <Field label="Start Time" required error={errors.startAt?.message}>
            <input type="datetime-local" {...register("startAt")} className={fieldInputClasses} />
            <p className="mt-1 text-xs text-charcoal/40">
              Studio hours are 7:00 AM–8:00 PM — the class must start and end within that window.
            </p>
          </Field>
          <Field label="Duration (minutes)" required error={errors.durationMinutes?.message}>
            <input type="number" step="5" {...register("durationMinutes")} className={fieldInputClasses} />
          </Field>
        </>
      )}

      <Field label="Capacity" required error={errors.capacity?.message}>
        <input type="number" min="1" max="20" step="1" {...register("capacity")} className={fieldInputClasses} />
        <p className="mt-1 text-xs text-charcoal/40">Studio maximum: 20 attendees.</p>
      </Field>
      <Field
        label="Minimum Participants (optional)"
        error={errors.minimumParticipants?.message}
      >
        <input type="number" min="1" max="20" step="1" placeholder="No minimum" {...register("minimumParticipants")} className={fieldInputClasses} />
      </Field>

      {serverError && <p className="text-sm text-red-600 sm:col-span-2">{serverError}</p>}

      <div className="flex gap-3 sm:col-span-2">
        <Button type="submit" disabled={submitting}>
          {submitting ? "Saving…" : editing ? "Save Changes" : "Schedule Session"}
        </Button>
        <Button type="button" variant="secondary" onClick={() => router.push("/admin/classes")}>
          Cancel
        </Button>
      </div>
    </form>
  );
}
