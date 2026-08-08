import { Resend } from "resend";
import { siteConfig } from "@/data/site";

const resendApiKey = process.env.RESEND_API_KEY;
const fromEmail = process.env.RESEND_FROM_EMAIL || "Veora Wellness <onboarding@resend.dev>";
const ownerEmail = process.env.OWNER_BOOKING_EMAIL;

export const isEmailConfigured = Boolean(resendApiKey);

const resend = resendApiKey ? new Resend(resendApiKey) : null;

function wrapper(title: string, bodyHtml: string) {
  return `
  <div style="background:#faf7f2;padding:32px 16px;font-family:Georgia,'Times New Roman',serif;">
    <div style="max-width:520px;margin:0 auto;background:#ffffff;border:1px solid #e5d8c3;border-radius:12px;overflow:hidden;">
      <div style="background:#221f1c;padding:24px 32px;">
        <p style="margin:0;color:#f3ecdf;font-size:12px;letter-spacing:0.2em;text-transform:uppercase;">Veora Wellness</p>
      </div>
      <div style="padding:32px;">
        <h1 style="margin:0 0 16px;font-size:20px;color:#221f1c;letter-spacing:0.02em;">${title}</h1>
        ${bodyHtml}
      </div>
      <div style="padding:20px 32px;background:#f3ecdf;">
        <p style="margin:0;font-size:12px;color:#8f8375;">Veora Wellness · ${siteConfig.contact.address.full}</p>
      </div>
    </div>
  </div>`;
}

function row(label: string, value: string) {
  return `
    <tr>
      <td style="padding:6px 0;font-size:13px;color:#8f8375;text-transform:uppercase;letter-spacing:0.08em;vertical-align:top;width:120px;">${label}</td>
      <td style="padding:6px 0;font-size:15px;color:#221f1c;">${value}</td>
    </tr>`;
}

export type BookingEmailPayload = {
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  serviceName: string;
  packageName?: string;
  formattedDate: string;
  time: string;
  notes?: string;
  submittedAt: string;
};

export async function sendOwnerBookingEmail(booking: BookingEmailPayload) {
  if (!resend || !ownerEmail) return { skipped: true as const };

  const fullName = `${booking.firstName} ${booking.lastName}`;
  const html = wrapper(
    "New Veora Booking",
    `<table style="width:100%;border-collapse:collapse;">
      ${row("Client", fullName)}
      ${row("Email", booking.email)}
      ${row("Phone", booking.phone)}
      ${row("Service", booking.serviceName)}
      ${booking.packageName ? row("Package", booking.packageName) : ""}
      ${row("Date", booking.formattedDate)}
      ${row("Time", booking.time)}
      ${row("Notes", booking.notes ? booking.notes : "—")}
      ${row("Submitted", booking.submittedAt)}
    </table>`
  );

  return resend.emails.send({
    from: fromEmail,
    to: ownerEmail,
    replyTo: booking.email,
    subject: `New Veora Booking — ${fullName} — ${booking.formattedDate}`,
    html,
  });
}

export async function sendCustomerBookingEmail(booking: BookingEmailPayload) {
  if (!resend) return { skipped: true as const };

  const statusLine =
    siteConfig.bookingStatusWording === "confirmed"
      ? "Your session is confirmed."
      : "We've received your reservation.";

  const html = wrapper(
    "Your Veora Session",
    `<p style="margin:0 0 16px;font-size:15px;color:#221f1c;">Hi ${booking.firstName},</p>
     <p style="margin:0 0 16px;font-size:15px;color:#221f1c;">Thank you for booking with Veora Wellness. ${statusLine}</p>
     <table style="width:100%;border-collapse:collapse;margin:16px 0;">
       ${row("Service", booking.serviceName)}
       ${booking.packageName ? row("Package", booking.packageName) : ""}
       ${row("Date", booking.formattedDate)}
       ${row("Time", booking.time)}
     </table>
     <p style="margin:16px 0 0;font-size:15px;color:#221f1c;">We'll be in touch if there are any additional details you need before your session.</p>
     <p style="margin:16px 0 0;font-size:15px;color:#221f1c;">We look forward to welcoming you.</p>
     <p style="margin:24px 0 0;font-size:15px;color:#221f1c;">Veora Wellness</p>`
  );

  return resend.emails.send({
    from: fromEmail,
    to: booking.email,
    subject: "Your Veora Session is Reserved",
    html,
  });
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

export async function sendPaymentProofSubmittedEmail(purchase: PurchaseEmailPayload) {
  if (!resend || !ownerEmail) return { skipped: true as const };

  const html = wrapper(
    "Payment Proof Submitted",
    `<table style="width:100%;border-collapse:collapse;">
      ${row("Customer", `${purchase.customerFirstName} (${purchase.customerEmail})`)}
      ${row("Package", purchase.packageName)}
      ${row("Reference", purchase.referenceNumber)}
      ${row("Amount", purchase.amountFormatted)}
    </table>
    <p style="margin:20px 0 0;font-size:15px;color:#221f1c;">Review and approve in the admin dashboard.</p>`
  );

  return resend.emails.send({
    from: fromEmail,
    to: ownerEmail,
    subject: `Payment Proof Submitted — ${purchase.referenceNumber}`,
    html,
  });
}

export async function sendPurchaseApprovedEmail(purchase: PurchaseEmailPayload) {
  if (!resend) return { skipped: true as const };

  const html = wrapper(
    "Payment Approved",
    `<p style="margin:0 0 16px;font-size:15px;color:#221f1c;">Hi ${purchase.customerFirstName},</p>
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
    `<p style="margin:0 0 16px;font-size:15px;color:#221f1c;">Hi ${purchase.customerFirstName},</p>
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

export async function sendContactEmail(contact: ContactEmailPayload) {
  if (!resend || !ownerEmail) return { skipped: true as const };

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
    <p style="margin:8px 0 0;font-size:15px;color:#221f1c;white-space:pre-wrap;">${contact.message}</p>`
  );

  return resend.emails.send({
    from: fromEmail,
    to: ownerEmail,
    replyTo: contact.email,
    subject: `New Veora Contact Message — ${fullName}`,
    html,
  });
}
