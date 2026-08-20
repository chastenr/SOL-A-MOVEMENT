import { Resend } from "resend";
import { siteConfig } from "@/data/site";

const resendApiKey = process.env.RESEND_API_KEY;
const fromEmail = process.env.RESEND_FROM_EMAIL || "Veora Wellness <onboarding@resend.dev>";

// Legacy catch-all — kept only as a last-resort fallback below so a blank
// env var during setup never means an email silently goes nowhere.
const ownerEmail = process.env.OWNER_BOOKING_EMAIL;

// Routine class-booking traffic goes to the bookings inbox, not
// Bianca/Ashley's inboxes, so it doesn't compete with judgment calls.
const bookingNotificationRecipients = [
  ...new Set(
    [process.env.BOOKING_NOTIFICATION_EMAIL, ownerEmail].filter((value): value is string => Boolean(value))
  ),
];

// Anything that needs an owner's judgment call — a payment to approve or
// reject, a contact-form inquiry — goes to both Bianca and Ashley.
const ownerDecisionRecipients = [
  ...new Set(
    [process.env.OWNER_NOTIFICATION_EMAIL, process.env.ASHLEY_NOTIFICATION_EMAIL, ownerEmail].filter(
      (value): value is string => Boolean(value)
    )
  ),
];

export const isEmailConfigured = Boolean(resendApiKey);

const resend = resendApiKey ? new Resend(resendApiKey) : null;

/** Keep customer-entered text as text when it is inserted into HTML emails. */
export function escapeEmailHtml(value: string) {
  return value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#39;");
}

function wrapper(title: string, bodyHtml: string) {
  return `
  <div style="background:#faf7f2;padding:32px 16px;font-family:Georgia,'Times New Roman',serif;">
    <div style="max-width:520px;margin:0 auto;background:#ffffff;border:1px solid #e5d8c3;border-radius:12px;overflow:hidden;">
      <div style="background:#221f1c;padding:24px 32px;">
        <p style="margin:0;color:#f3ecdf;font-size:12px;letter-spacing:0.2em;text-transform:uppercase;">Veora Wellness</p>
      </div>
      <div style="padding:32px;">
        <h1 style="margin:0 0 16px;font-size:20px;color:#221f1c;letter-spacing:0.02em;">${escapeEmailHtml(title)}</h1>
        ${bodyHtml}
      </div>
      <div style="padding:20px 32px;background:#f3ecdf;">
        <p style="margin:0;font-size:12px;color:#8f8375;">Veora Wellness · ${escapeEmailHtml(siteConfig.contact.address.full)}</p>
      </div>
    </div>
  </div>`;
}

function row(label: string, value: string) {
  return `
    <tr>
      <td style="padding:6px 0;font-size:13px;color:#8f8375;text-transform:uppercase;letter-spacing:0.08em;vertical-align:top;width:120px;">${escapeEmailHtml(label)}</td>
      <td style="padding:6px 0;font-size:15px;color:#221f1c;">${escapeEmailHtml(value)}</td>
    </tr>`;
}

export type ContactEmailPayload = {
  firstName: string;
  lastName: string;
  email: string;
  phone?: string;
  topic: string;
  message: string;
  submittedAt: string;
};

export type PurchaseEmailPayload = {
  customerEmail: string;
  customerFirstName: string;
  packageName: string;
  referenceNumber: string;
  amountFormatted: string;
};

export async function sendPaymentProofSubmittedEmail(purchase: PurchaseEmailPayload & { reviewUrl?: string }) {
  if (!resend || ownerDecisionRecipients.length === 0) return { skipped: true as const };

  const html = wrapper(
    "Payment Proof Submitted",
    `<table style="width:100%;border-collapse:collapse;">
      ${row("Customer", `${purchase.customerFirstName} (${purchase.customerEmail})`)}
      ${row("Package", purchase.packageName)}
      ${row("Reference", purchase.referenceNumber)}
      ${row("Amount", purchase.amountFormatted)}
    </table>
    ${
      purchase.reviewUrl
        ? `<p style="margin:20px 0 0;"><a href="${escapeEmailHtml(purchase.reviewUrl)}" style="color:#a97456;font-size:15px;">Review and approve this payment →</a></p>`
        : `<p style="margin:20px 0 0;font-size:15px;color:#221f1c;">Review and approve in the admin dashboard.</p>`
    }`
  );

  return resend.emails.send({
    from: fromEmail,
    to: ownerDecisionRecipients,
    subject: `Payment Proof Submitted — ${purchase.referenceNumber}`,
    html,
  });
}

export async function sendPurchaseApprovedEmail(purchase: PurchaseEmailPayload) {
  if (!resend) return { skipped: true as const };

  const html = wrapper(
    "Payment Approved",
    `<p style="margin:0 0 16px;font-size:15px;color:#221f1c;">Hi ${escapeEmailHtml(purchase.customerFirstName)},</p>
     <p style="margin:0 0 16px;font-size:15px;color:#221f1c;">Your payment has been confirmed and your credits are now active.</p>
     <table style="width:100%;border-collapse:collapse;margin:16px 0;">
       ${row("Package", purchase.packageName)}
       ${row("Reference", purchase.referenceNumber)}
       ${row("Amount", purchase.amountFormatted)}
     </table>
     <p style="margin:16px 0 0;font-size:15px;color:#221f1c;">Sign in to your account to book your first class.</p>`
  );

  return resend.emails.send({
    from: fromEmail,
    to: purchase.customerEmail,
    subject: "Your Veora Payment is Confirmed",
    html,
  });
}

export async function sendPurchaseRejectedEmail(purchase: PurchaseEmailPayload & { reason?: string }) {
  if (!resend) return { skipped: true as const };

  const html = wrapper(
    "Payment Could Not Be Verified",
    `<p style="margin:0 0 16px;font-size:15px;color:#221f1c;">Hi ${escapeEmailHtml(purchase.customerFirstName)},</p>
     <p style="margin:0 0 16px;font-size:15px;color:#221f1c;">We weren't able to verify your recent payment.</p>
     <table style="width:100%;border-collapse:collapse;margin:16px 0;">
       ${row("Package", purchase.packageName)}
       ${row("Reference", purchase.referenceNumber)}
       ${row("Amount", purchase.amountFormatted)}
       ${purchase.reason ? row("Reason", purchase.reason) : ""}
     </table>
     <p style="margin:16px 0 0;font-size:15px;color:#221f1c;">Please contact us so we can help resolve this.</p>`
  );

  return resend.emails.send({
    from: fromEmail,
    to: purchase.customerEmail,
    subject: "Update on Your Veora Payment",
    html,
  });
}

export type ClassBookingEmailPayload = {
  customerFirstName: string;
  customerLastName: string;
  customerEmail: string;
  customerPhone: string;
  className: string;
  coachName: string;
  formattedDate: string;
  time: string;
  packageName: string;
  packageAmountFormatted: string;
  originalSessions: number;
  sessionsUsed: number;
  sessionsRemaining: number;
  status: string;
};

/**
 * Internal "new reservation" notice for the member booking engine. The
 * field set matches the studio's requested format exactly (client,
 * class, coach, date, time, package, amount, original/used/remaining
 * sessions, status) so Bianca/Ashley can act on the email alone.
 */
export async function sendClassBookingNotificationEmail(booking: ClassBookingEmailPayload) {
  if (!resend || bookingNotificationRecipients.length === 0) return { skipped: true as const };

  const fullName = `${booking.customerFirstName} ${booking.customerLastName}`.trim();
  const html = wrapper(
    "New Booking",
    `<table style="width:100%;border-collapse:collapse;">
      ${row("Client", fullName)}
      ${row("Email", booking.customerEmail)}
      ${row("Phone", booking.customerPhone || "—")}
      ${row("Class", booking.className)}
      ${row("Coach", booking.coachName)}
      ${row("Date", booking.formattedDate)}
      ${row("Time (PHT)", booking.time)}
      ${row("Package", booking.packageName)}
      ${row("Package Purchase", booking.packageAmountFormatted)}
      ${row("Original Credits", String(booking.originalSessions))}
      ${row("Credits Used", String(booking.sessionsUsed))}
      ${row("Credits Remaining", String(booking.sessionsRemaining))}
      ${row("Status", booking.status)}
    </table>`
  );

  return resend.emails.send({
    from: fromEmail,
    to: bookingNotificationRecipients,
    subject: `New Booking — ${fullName} — ${booking.className} — ${booking.formattedDate}`,
    html,
  });
}

export type ClassScheduleEmailPayload = {
  customerFirstName: string;
  customerEmail: string;
  className: string;
  coachName: string;
  formattedDate: string;
  time: string;
  endTime?: string;
  arrivalTime?: string;
  bookingReference?: string;
  packageName: string;
  sessionsRemaining?: number;
};

/** Sent the moment a class-credit reservation is created (see /api/bookings). */
export async function sendClassBookingConfirmationEmail(booking: ClassScheduleEmailPayload) {
  if (!resend) return { skipped: true as const };

  const html = wrapper(
    "Your Reservation is In",
    `<p style="margin:0 0 16px;font-size:15px;color:#221f1c;">Hi ${escapeEmailHtml(booking.customerFirstName)},</p>
     <p style="margin:0 0 16px;font-size:15px;color:#221f1c;">We've received your reservation. One credit was deducted from your package.</p>
     <table style="width:100%;border-collapse:collapse;margin:16px 0;">
       ${row("Class", booking.className)}
       ${row("Coach", booking.coachName)}
       ${row("Date", booking.formattedDate)}
       ${row("Time (PHT)", booking.endTime ? `${booking.time} – ${booking.endTime}` : booking.time)}
       ${booking.bookingReference ? row("Booking ID", booking.bookingReference) : ""}
       ${row("Package", booking.packageName)}
       ${booking.sessionsRemaining !== undefined ? row("Credits Remaining", String(booking.sessionsRemaining)) : ""}
     </table>
     ${
       booking.arrivalTime
         ? `<p style="margin:0 0 16px;font-size:15px;color:#221f1c;"><strong>Please arrive at least 10 minutes before your class begins</strong> — by ${escapeEmailHtml(booking.arrivalTime)} PHT.</p>`
         : ""
     }
     <p style="margin:16px 0 0;font-size:15px;color:#221f1c;">Bookings close at 10:00 PM PHT the evening before class. If we need to cancel your class, your session credit will automatically be returned.</p>
     <p style="margin:16px 0 0;font-size:15px;color:#221f1c;">We look forward to seeing you.</p>
     <p style="margin:24px 0 0;font-size:15px;color:#221f1c;">Veora Wellness</p>`
  );

  return resend.emails.send({
    from: fromEmail,
    to: booking.customerEmail,
    subject: `Your Reservation — ${booking.className} — ${booking.formattedDate}`,
    html,
  });
}

/**
 * Sent to every affected customer when the studio cancels a class (a
 * single booking, a whole manually-cancelled session, or the automatic
 * below-minimum-attendance job — `reason` distinguishes the wording without
 * needing three near-identical templates).
 */
export async function sendClassCancelledByStudioEmail(
  booking: ClassScheduleEmailPayload & { reason?: "low_enrollment" | "studio" }
) {
  if (!resend) return { skipped: true as const };

  const reasonLine =
    booking.reason === "low_enrollment"
      ? "This class didn't reach the minimum number of reservations needed to run today."
      : `Unfortunately, your ${booking.className} class has been cancelled.`;

  const html = wrapper(
    "Class Cancellation",
    `<p style="margin:0 0 16px;font-size:15px;color:#221f1c;">Hi ${escapeEmailHtml(booking.customerFirstName)},</p>
     <p style="margin:0 0 16px;font-size:15px;color:#221f1c;">${escapeEmailHtml(reasonLine)}</p>
     <table style="width:100%;border-collapse:collapse;margin:16px 0;">
       ${row("Class", booking.className)}
       ${row("Coach", booking.coachName)}
       ${row("Date", booking.formattedDate)}
       ${row("Time (PHT)", booking.time)}
     </table>
     <p style="margin:16px 0 0;font-size:15px;color:#221f1c;">Your reservation credit has automatically been returned to your package.</p>
     <table style="width:100%;border-collapse:collapse;margin:16px 0;">
       ${row("Package", booking.packageName)}
       ${booking.sessionsRemaining !== undefined ? row("Credits Remaining", String(booking.sessionsRemaining)) : ""}
     </table>
     <p style="margin:16px 0 0;font-size:15px;color:#221f1c;">We apologize for the inconvenience.</p>
     <p style="margin:24px 0 0;font-size:15px;color:#221f1c;">Veora Wellness</p>`
  );

  return resend.emails.send({
    from: fromEmail,
    to: booking.customerEmail,
    subject: `Class Cancellation — ${booking.className} — ${booking.formattedDate}`,
    html,
  });
}

/** Sent once a class clears its minimum-attendance check at the 10 PM cutoff. */
export async function sendClassConfirmedEmail(booking: ClassScheduleEmailPayload) {
  if (!resend) return { skipped: true as const };

  const html = wrapper(
    "Your Class is Confirmed",
    `<p style="margin:0 0 16px;font-size:15px;color:#221f1c;">Hi ${escapeEmailHtml(booking.customerFirstName)},</p>
     <p style="margin:0 0 16px;font-size:15px;color:#221f1c;">Good news — your class is confirmed and will run as scheduled.</p>
     <table style="width:100%;border-collapse:collapse;margin:16px 0;">
       ${row("Class", booking.className)}
       ${row("Coach", booking.coachName)}
       ${row("Date", booking.formattedDate)}
       ${row("Time (PHT)", booking.endTime ? `${booking.time} – ${booking.endTime}` : booking.time)}
     </table>
     ${
       booking.arrivalTime
         ? `<p style="margin:0 0 16px;font-size:15px;color:#221f1c;">Please arrive by <strong>${escapeEmailHtml(booking.arrivalTime)} PHT</strong>, which is 10 minutes before your class starts.</p>`
         : ""
     }
     <p style="margin:16px 0 0;font-size:15px;color:#221f1c;">We look forward to seeing you.</p>
     <p style="margin:24px 0 0;font-size:15px;color:#221f1c;">Veora Wellness</p>`
  );

  return resend.emails.send({
    from: fromEmail,
    to: booking.customerEmail,
    subject: `Class Confirmed — ${booking.className} — ${booking.formattedDate}`,
    html,
  });
}

export async function sendContactEmail(contact: ContactEmailPayload) {
  if (!resend || ownerDecisionRecipients.length === 0) return { skipped: true as const };

  const fullName = `${contact.firstName} ${contact.lastName}`;
  const html = wrapper(
    "New Veora Contact Message",
    `<table style="width:100%;border-collapse:collapse;">
      ${row("From", fullName)}
      ${row("Email", contact.email)}
      ${row("Phone", contact.phone ? contact.phone : "—")}
      ${row("Topic", contact.topic)}
      ${row("Submitted", contact.submittedAt)}
    </table>
    <p style="margin:20px 0 0;font-size:13px;color:#8f8375;text-transform:uppercase;letter-spacing:0.08em;">Message</p>
    <p style="margin:8px 0 0;font-size:15px;color:#221f1c;white-space:pre-wrap;">${escapeEmailHtml(contact.message)}</p>`
  );

  return resend.emails.send({
    from: fromEmail,
    to: ownerDecisionRecipients,
    replyTo: contact.email,
    subject: `New Veora Contact Message — ${fullName}`,
    html,
  });
}
