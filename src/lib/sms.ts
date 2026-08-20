import "server-only";
import { normalizePhoneE164 } from "@/lib/phone";

const SEMAPHORE_MESSAGES_URL = "https://api.semaphore.co/api/v4/messages";
const SEMAPHORE_OTP_URL = "https://api.semaphore.co/api/v4/otp";
const apiKey = process.env.SEMAPHORE_API_KEY?.trim();
const senderName = process.env.SEMAPHORE_SENDER_NAME?.trim();
const smsEnabled = process.env.SMS_ENABLED === "true";

// Requiring an explicit sender name prevents the app from appearing ready
// while the Semaphore account still has no approved/default sender name.
export const isSmsConfigured = Boolean(smsEnabled && apiKey && senderName);

export type SmsPayload = {
  to: string;
  body: string;
};

export type SmsDelivery = {
  messageId: number | string;
  recipient: string;
  status: string;
};

type SemaphoreMessage = {
  message_id?: number | string;
  recipient?: string;
  status?: string;
  message?: string;
  code?: number | string;
};

export class SemaphoreError extends Error {
  constructor(
    message: string,
    public readonly httpStatus?: number,
    public readonly providerResponse?: unknown,
    options?: ErrorOptions
  ) {
    super(message, options);
    this.name = "SemaphoreError";
  }
}

function getErrorMessage(value: unknown): string | null {
  if (!value || typeof value !== "object") return null;
  const record = value as Record<string, unknown>;
  for (const key of ["message", "error"]) {
    if (typeof record[key] === "string" && record[key].trim()) return record[key].trim();
  }
  return null;
}

/**
 * Sends one transactional SMS through Semaphore. This module is server-only,
 * never logs the API key or message body, and deliberately does not retry a
 * POST automatically because a timed-out request may already have been queued.
 */
async function sendSemaphoreRequest(
  endpoint: string,
  payload: SmsPayload,
  code?: string
): Promise<SmsDelivery[]> {
  if (!smsEnabled || !apiKey || !senderName) {
    throw new Error(
      "SMS is not configured — enable SMS and set the Semaphore credentials."
    );
  }

  const normalized = normalizePhoneE164(payload.to);
  if (!normalized) {
    throw new Error("Semaphore SMS requires a valid Philippine mobile number.");
  }

  const testNumber = process.env.SMS_TEST_NUMBER?.trim();
  const resolvedTestNumber = testNumber ? normalizePhoneE164(testNumber) : null;
  if (testNumber && !resolvedTestNumber) throw new Error("SMS_TEST_NUMBER is not a valid Philippine mobile number.");
  const recipient = process.env.NODE_ENV === "production" ? normalized : resolvedTestNumber;
  if (!recipient) {
    return [{ messageId: "development-skip", recipient: normalized.slice(1), status: "Skipped" }];
  }

  const body = payload.body.trim();
  if (!body) throw new Error("SMS message cannot be empty.");

  const form = new URLSearchParams({
    apikey: apiKey,
    number: recipient.slice(1),
    message: body,
    sendername: senderName,
  });
  if (code) form.set("code", code);

  let response: Response;
  try {
    response = await fetch(endpoint, {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: form,
      cache: "no-store",
      signal: AbortSignal.timeout(10_000),
    });
  } catch (error) {
    throw new SemaphoreError("Semaphore could not be reached.", undefined, undefined, { cause: error });
  }

  const result: unknown = await response.json().catch(() => null);
  if (!response.ok) {
    throw new SemaphoreError(
      getErrorMessage(result) ?? `Semaphore request failed with HTTP ${response.status}.`,
      response.status,
      result
    );
  }

  if (!Array.isArray(result) || result.length === 0) {
    throw new SemaphoreError(getErrorMessage(result) ?? "Semaphore returned an unexpected response.", response.status, result);
  }

  const messages = result as SemaphoreMessage[];
  const failed = messages.find((message) => message.status?.toLowerCase() === "failed");
  if (failed) throw new SemaphoreError(failed.message || "Semaphore rejected the SMS.", response.status, result);

  return messages.map((message) => ({
    messageId: message.message_id ?? "unknown",
    recipient: message.recipient ?? recipient.slice(1),
    status: message.status ?? "Queued",
  }));
}

export async function sendSms(payload: SmsPayload): Promise<SmsDelivery[]> {
  return sendSemaphoreRequest(SEMAPHORE_MESSAGES_URL, payload);
}

/** Sends a server-generated six-digit code through Semaphore's OTP route. */
export async function sendOtp(to: string, code: string): Promise<SmsDelivery[]> {
  if (!/^\d{6}$/.test(code)) throw new Error("OTP code must contain six digits.");
  return sendSemaphoreRequest(
    SEMAPHORE_OTP_URL,
    { to, body: "Your VEORA verification code is {otp}. It expires in 5 minutes." },
    code
  );
}
