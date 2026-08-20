/**
 * Normalizes a Philippine mobile number to E.164. VEORA serves Philippine
 * customers, so accepting arbitrary international-looking strings here would
 * only defer invalid-recipient failures to Semaphore.
 */
export function normalizePhoneE164(raw: string): string | null {
  const trimmed = raw.trim();
  if (!trimmed || !/^[+\d\s().-]+$/.test(trimmed)) return null;
  const compact = trimmed.replace(/[\s().-]/g, "");

  if (/^09\d{9}$/.test(compact)) return `+63${compact.slice(1)}`;
  if (/^9\d{9}$/.test(compact)) return `+63${compact}`;
  if (/^639\d{9}$/.test(compact)) return `+${compact}`;
  if (/^\+639\d{9}$/.test(compact)) return compact;
  return null;
}

/** True when `value` is already a normalizable phone number. */
export function isValidPhone(value: string): boolean {
  return normalizePhoneE164(value) !== null;
}

/**
 * Masks an E.164 phone number for display (e.g. "+639171234567" ->
 * "+63 ••• ••• 4567"). Never show the full number after initial entry.
 *
 * E.164 doesn't self-delineate where the country code ends, so we can't
 * reliably split any number into "country code + subscriber number" — we
 * special-case our primary market (+63, Philippines) for a precise, familiar
 * display and fall back to a generic mask (still leaking only the last 4
 * digits) for anything else.
 */
export function maskPhone(e164: string): string {
  const last4 = e164.slice(-4);
  if (e164.startsWith("+63") && e164.length >= 8) {
    return `+63 ••• ••• ${last4}`;
  }
  return `${e164.slice(0, 1)}${"•".repeat(Math.max(e164.length - 5, 3))} ${last4}`;
}
