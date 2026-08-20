import "server-only";
import { supabaseAdmin } from "@/lib/supabase/admin";
import { isSmsConfigured, SemaphoreError, sendSms } from "@/lib/sms";
import {
  bookingCancellationSms,
  bookingConfirmationSms,
  bookingReminderSms,
} from "@/lib/sms-templates";
import { formatManilaShortDate } from "@/lib/manila-time";

export type BookingSmsType =
  | "booking_confirmation"
  | "reminder_24h"
  | "reminder_2h"
  | "booking_cancelled";

type NotificationResult = "sent" | "skipped" | "failed";

function safeProviderSummary(error: unknown): unknown {
  if (!(error instanceof SemaphoreError) || !Array.isArray(error.providerResponse)) return undefined;
  return error.providerResponse.map((item) => {
    const row = item && typeof item === "object" ? item as Record<string, unknown> : {};
    return { messageId: row.message_id, status: row.status, error: row.error };
  });
}

async function sendTrackedBookingSms(input: {
  bookingId: string;
  type: BookingSmsType;
  to: string;
  body: string;
}): Promise<NotificationResult> {
  if (!isSmsConfigured || !supabaseAdmin) return "skipped";

  const { data: claim, error: claimError } = await supabaseAdmin
    .rpc("claim_booking_sms_notification", {
      p_booking_id: input.bookingId,
      p_type: input.type,
    })
    .maybeSingle();

  if (claimError) {
    console.error("[booking-sms] notification claim failed", {
      bookingId: input.bookingId,
      type: input.type,
      error: claimError.message,
    });
    return "failed";
  }
  if (!claim) return "skipped";

  const notification = claim as { notification_id: string; attempt_count: number };
  try {
    const deliveries = await sendSms({ to: input.to, body: input.body });
    const delivery = deliveries[0];
    if (delivery?.status === "Skipped") {
      await supabaseAdmin
        .from("booking_notifications")
        .update({ status: "failed", failed_at: new Date().toISOString(), error: "Skipped outside production without SMS_TEST_NUMBER" })
        .eq("id", notification.notification_id);
      return "skipped";
    }

    const { error: updateError } = await supabaseAdmin
      .from("booking_notifications")
      .update({
        status: "sent",
        provider_message_id: String(delivery?.messageId ?? "unknown"),
        sent_at: new Date().toISOString(),
        failed_at: null,
        error: null,
      })
      .eq("id", notification.notification_id);
    if (updateError) throw new Error(`SMS sent but delivery tracking failed: ${updateError.message}`);
    return "sent";
  } catch (error) {
    const message = error instanceof Error ? error.message.slice(0, 500) : "Unknown Semaphore error";
    await supabaseAdmin
      .from("booking_notifications")
      .update({ status: "failed", failed_at: new Date().toISOString(), error: message })
      .eq("id", notification.notification_id);

    console.error("[booking-sms] Semaphore delivery failed", {
      bookingId: input.bookingId,
      type: input.type,
      attempt: notification.attempt_count,
      status: error instanceof SemaphoreError ? error.httpStatus : undefined,
      providerResponse: safeProviderSummary(error),
      timestamp: new Date().toISOString(),
      error: message,
    });
    return "failed";
  }
}

export function sendBookingConfirmationSms(input: {
  bookingId: string;
  to: string;
  className: string;
  coachName: string;
  startAt: string | Date;
}): Promise<NotificationResult> {
  return sendTrackedBookingSms({
    bookingId: input.bookingId,
    type: "booking_confirmation",
    to: input.to,
    body: bookingConfirmationSms({
      className: input.className,
      coachName: input.coachName,
      date: formatManilaShortDate(input.startAt),
      startAt: input.startAt,
    }),
  });
}

export function sendBookingReminderSms(input: {
  bookingId: string;
  type: "reminder_24h" | "reminder_2h";
  to: string;
  className: string;
  coachName: string;
  startAt: string | Date;
}): Promise<NotificationResult> {
  return sendTrackedBookingSms({
    bookingId: input.bookingId,
    type: input.type,
    to: input.to,
    body: bookingReminderSms(input),
  });
}

export function sendBookingCancellationSms(input: {
  bookingId: string;
  to: string;
  className: string;
  startAt: string | Date;
}): Promise<NotificationResult> {
  return sendTrackedBookingSms({
    bookingId: input.bookingId,
    type: "booking_cancelled",
    to: input.to,
    body: bookingCancellationSms({
      className: input.className,
      date: formatManilaShortDate(input.startAt),
      startAt: input.startAt,
    }),
  });
}

type BookingForCancellation = {
  id: string;
  user_id: string;
  class_session: {
    start_at: string;
    class_type: { name: string } | null;
  } | null;
};

/** Shared by customer, admin, and whole-class cancellation paths. */
export async function sendBookingCancellationSmsForId(bookingId: string): Promise<NotificationResult> {
  if (!supabaseAdmin || !isSmsConfigured) return "skipped";
  const { data } = await supabaseAdmin
    .from("class_bookings")
    .select("id, user_id, class_session:class_sessions(start_at, class_type:class_types(name))")
    .eq("id", bookingId)
    .eq("status", "cancelled")
    .single();
  if (!data) return "skipped";
  const booking = data as unknown as BookingForCancellation;

  const { data: profile } = await supabaseAdmin
    .from("profiles")
    .select("mobile_number, phone_verified_at")
    .eq("id", booking.user_id)
    .single();
  if (!profile?.mobile_number || !profile.phone_verified_at || !booking.class_session) return "skipped";

  return sendBookingCancellationSms({
    bookingId,
    to: profile.mobile_number,
    className: booking.class_session.class_type?.name ?? "Class",
    startAt: booking.class_session.start_at,
  });
}
