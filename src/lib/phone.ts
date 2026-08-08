const DEFAULT_COUNTRY_CODE = "63"; // Philippines

/**
 * Normalizes a customer-typed phone number to E.164 (e.g. "09171234567" or
 * "0917 123 4567" -> "+639171234567"). Returns null when the input can't be
 * confidently normalized — callers must treat that as a validation failure,
 * never guess or pass the raw string through to Supabase's phone APIs.
 */
export function normalizePhoneE164(raw: string, defaultCountryCode = DEFAULT_COUNTRY_CODE): string | null {
  const trimmed = raw.trim();
  const digitsAndPlus = trimmed.replace(/[^\d+]/g, "");
  if (!digitsAndPlus) return null;

  if (digitsAndPlus.startsWith("+")) {
    const numeric = digitsAndPlus.slice(1);
    if (!/^\d{8,15}$/.test(numeric)) return null;
    return `+${numeric}`;
  }

  const withoutLeadingZero = digitsAndPlus.replace(/^0+/, "");
  if (!/^\d{7,13}$/.test(withoutLeadingZero)) return null;
  return `+${defaultCountryCode}${withoutLeadingZero}`;
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
