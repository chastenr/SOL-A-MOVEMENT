// Twilio SMS — reserved, not yet implemented. Nothing in the app calls this
// today; email is the only required notification channel (booking
// confirmation, class cancellation). This exists so the notification
// architecture is "email provider + SMS provider" from day one — a caller
// gets a clear, immediate error instead of a silent no-op that could be
// mistaken for "the text was sent."
const accountSid = process.env.TWILIO_ACCOUNT_SID;
const authToken = process.env.TWILIO_AUTH_TOKEN;
const fromNumber = process.env.TWILIO_PHONE_NUMBER;

export const isSmsConfigured = Boolean(accountSid && authToken && fromNumber);

export type SmsPayload = {
  to: string;
  body: string;
};

export async function sendSms(payload: SmsPayload): Promise<void> {
  void payload;
  if (!isSmsConfigured) {
    throw new Error(
      "SMS is not configured — set TWILIO_ACCOUNT_SID, TWILIO_AUTH_TOKEN and TWILIO_PHONE_NUMBER."
    );
  }
  throw new Error("Twilio client is not implemented yet.");
}
