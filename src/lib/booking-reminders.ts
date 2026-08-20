export type ReminderType = "reminder_24h" | "reminder_2h";

const WINDOWS = [
  { type: "reminder_24h" as const, minMinutes: 23 * 60 + 50, maxMinutes: 24 * 60 + 10 },
  { type: "reminder_2h" as const, minMinutes: 110, maxMinutes: 130 },
];

export function getBookingReminderType(startAt: string | Date, now: Date = new Date()): ReminderType | null {
  const minutesUntilStart = (new Date(startAt).getTime() - now.getTime()) / (60 * 1000);
  if (minutesUntilStart <= 0) return null;
  return WINDOWS.find(
    (candidate) => minutesUntilStart >= candidate.minMinutes && minutesUntilStart <= candidate.maxMinutes
  )?.type ?? null;
}
