import "server-only";
import { normalizePhoneE164 } from "@/lib/phone";

const SEMAPHORE_MESSAGES_URL = "https://api.semaphore.co/api/v4/messages";
const apiKey = process.env.SEMAPHORE_API_KEY?.trim();
const senderName = process.env.SEMAPHORE_SENDER_NAME?.trim();

// Requiring an explicit sender name prevents the app from appearing ready
// while the Semaphore account still has no approved/default sender name.
export const isSmsConfigured = Boolean(apiKey && senderName);

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
};

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
export async function sendSms(payload: SmsPayload): Promise<SmsDelivery[]> {
  if (!apiKey || !senderName) {
    throw new Error(
      "SMS is not configured — set SEMAPHORE_API_KEY and an approved SEMAPHORE_SENDER_NAME."
    );
  }

  const normalized = normalizePhoneE164(payload.to);
  if (!normalized || !normalized.startsWith("+63")) {
    throw new Error("Semaphore SMS requires a valid Philippine mobile number.");
  }

  const body = payload.body.trim();
  if (!body) throw new Error("SMS message cannot be empty.");

  const form = new URLSearchParams({
    apikey: apiKey,
    number: normalized.slice(1),
    message: body,
    sendername: senderName,
  });

  let response: Response;
  try {
    response = await fetch(SEMAPHORE_MESSAGES_URL, {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: form,
      cache: "no-store",
      signal: AbortSignal.timeout(10_000),
    });
  } catch (error) {
    throw new Error("Semaphore could not be reached.", { cause: error });
  }

  const result: unknown = await response.json().catch(() => null);
  if (!response.ok) {
    throw new Error(getErrorMessage(result) ?? `Semaphore request failed with HTTP ${response.status}.`);
  }

  if (!Array.isArray(result) || result.length === 0) {
    throw new Error(getErrorMessage(result) ?? "Semaphore returned an unexpected response.");
  }

  const messages = result as SemaphoreMessage[];
  const failed = messages.find((message) => message.status?.toLowerCase() === "failed");
  if (failed) throw new Error(failed.message || "Semaphore rejected the SMS.");

  return messages.map((message) => ({
    messageId: message.message_id ?? "unknown",
    recipient: message.recipient ?? normalized.slice(1),
    status: message.status ?? "Queued",
  }));
}
