// Studio hours confirmed by the client: 7:00 AM – 8:00 PM daily.
export const STUDIO_OPEN_HOUR = 7;
export const STUDIO_CLOSE_HOUR = 20;

// Fixed length for Mat Pilates/Yoga/Barre/Strength & HIIT, confirmed by the
// client: 50 minutes, back-to-back on the hour with a 10-minute turnover
// before the next class. Ballet is NOT on this schedule — those classes are
// 60/90 minutes (see class_types.duration_minutes) and keep a free-typed
// start time + duration in the admin form.
export const CLASS_DURATION_MINUTES = 50;

export function formatHourLabel(hour: number): string {
  const period = hour < 12 ? "AM" : "PM";
  const displayHour = hour % 12 === 0 ? 12 : hour % 12;
  return `${displayHour}:00 ${period}`;
}

/**
 * A <input type="datetime-local"> value carries no timezone at all — the
 * admin, scheduling from the Philippines, types what they see on a Manila
 * wall clock. Reading the hour/minute straight out of the string (rather
 * than constructing a Date and asking its hour) is what makes this
 * correct regardless of what timezone the server process itself runs in.
 */
export function getMinutesSinceMidnight(datetimeLocal: string): number | null {
  const match = /T(\d{2}):(\d{2})/.exec(datetimeLocal);
  if (!match) return null;
  return Number(match[1]) * 60 + Number(match[2]);
}

export function isWithinStudioHours(datetimeLocal: string, durationMinutes: number): boolean {
  const start = getMinutesSinceMidnight(datetimeLocal);
  if (start === null || !Number.isFinite(durationMinutes)) return false;
  const end = start + durationMinutes;
  return start >= STUDIO_OPEN_HOUR * 60 && end <= STUDIO_CLOSE_HOUR * 60;
}

/**
 * Converts a Manila-wall-clock datetime-local string to the correct UTC
 * instant. Manila has been a fixed UTC+8 with no DST since 1978, so a
 * literal "+08:00" suffix is always correct — no timezone database needed.
 *
 * This replaces a real bug: the previous code passed the raw datetime-local
 * string straight to `new Date(...)`, which JS parses as the SERVER's own
 * local timezone (UTC on Vercel), not the admin's. A class typed as
 * "7:00 AM" was being stored as 7:00 AM UTC — 3:00 PM Manila — silently
 * 8 hours off from what was scheduled.
 */
export function manilaLocalToUtc(datetimeLocal: string): Date {
  return new Date(`${datetimeLocal}+08:00`);
}
