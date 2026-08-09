// Asia/Manila has been a fixed UTC+8 with no DST since 1978 — safe to hard
// -code the offset rather than pulling in a timezone database for this.
const MANILA_OFFSET_MS = 8 * 60 * 60 * 1000;
const DAY_MS = 24 * 60 * 60 * 1000;

/**
 * 10:00 PM Manila time on the calendar day before the session's
 * Manila-local date — mirrors book_class_session()'s SQL exactly
 * (migration 0008), so display/admin code and the database enforce the
 * identical rule instead of two independently-maintained versions of it.
 */
export function getBookingCutoff(sessionStartAt: Date): Date {
  const manilaLocal = new Date(sessionStartAt.getTime() + MANILA_OFFSET_MS);
  const manilaMidnightUtc = Date.UTC(
    manilaLocal.getUTCFullYear(),
    manilaLocal.getUTCMonth(),
    manilaLocal.getUTCDate()
  );
  const cutoffAsManilaWallClock = manilaMidnightUtc - DAY_MS + 22 * 60 * 60 * 1000;
  return new Date(cutoffAsManilaWallClock - MANILA_OFFSET_MS);
}

export function isPastBookingCutoff(sessionStartAt: Date, now: Date = new Date()): boolean {
  return now.getTime() >= getBookingCutoff(sessionStartAt).getTime();
}

/** The [start, end) UTC instants bounding "today" as a Manila calendar day. */
export function getManilaDayRange(reference: Date = new Date()): { start: Date; end: Date } {
  const manilaLocal = new Date(reference.getTime() + MANILA_OFFSET_MS);
  const manilaMidnightUtc = Date.UTC(
    manilaLocal.getUTCFullYear(),
    manilaLocal.getUTCMonth(),
    manilaLocal.getUTCDate()
  );
  return {
    start: new Date(manilaMidnightUtc - MANILA_OFFSET_MS),
    end: new Date(manilaMidnightUtc + DAY_MS - MANILA_OFFSET_MS),
  };
}
