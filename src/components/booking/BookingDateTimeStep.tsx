"use client";

import { BookingCalendar } from "@/components/booking/BookingCalendar";
import { TimeSlotSelector } from "@/components/booking/TimeSlotSelector";
import { Button } from "@/components/ui/Button";

type BookingDateTimeStepProps = {
  date?: string;
  time?: string;
  onSelectDate: (date: string) => void;
  onSelectTime: (time: string) => void;
  onContinue: () => void;
  onBack: () => void;
};

export function BookingDateTimeStep({
  date,
  time,
  onSelectDate,
  onSelectTime,
  onContinue,
  onBack,
}: BookingDateTimeStepProps) {
  return (
    <div>
      <h2 className="font-display text-3xl text-charcoal sm:text-4xl">Choose a date &amp; time</h2>
      <p className="mt-2 text-charcoal/60">Select an available date, then a time that works for you.</p>

      <div className="mt-8 grid gap-8 lg:grid-cols-[minmax(0,360px)_1fr]">
        <BookingCalendar
          selectedDate={date}
          onSelectDate={(nextDate) => {
            onSelectDate(nextDate);
            if (time && nextDate !== date) onSelectTime("");
          }}
        />

        <div>
          {date ? (
            <TimeSlotSelector date={date} selectedTime={time} onSelectTime={onSelectTime} />
          ) : (
            <p className="rounded-2xl border border-dashed border-charcoal/15 p-8 text-center text-sm text-charcoal/50">
              Select a date to see available times.
            </p>
          )}
        </div>
      </div>

      <div className="mt-10 flex justify-between">
        <Button type="button" variant="secondary" size="lg" onClick={onBack}>
          Back
        </Button>
        <Button type="button" size="lg" disabled={!date || !time} onClick={onContinue}>
          Continue
        </Button>
      </div>
    </div>
  );
}
