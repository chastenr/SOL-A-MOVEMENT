import "server-only";
import { sendNewCustomerSignupNotificationEmail } from "@/lib/email";
import { isSmsConfigured, sendSms } from "@/lib/sms";
import { newCustomerSignupSms } from "@/lib/sms-templates";

const DEFAULT_OWNER_NOTIFICATION_PHONE = "+639173194772";

export async function notifyOwnerOfNewCustomerSignup(input: {
  userId: string;
  firstName: string;
  lastName: string;
  email: string;
  mobileNumber: string;
}): Promise<void> {
  const ownerPhone = process.env.OWNER_NOTIFICATION_PHONE?.trim()
    || DEFAULT_OWNER_NOTIFICATION_PHONE;

  const notify = async (channel: "email" | "sms", task: () => Promise<unknown>) => {
    try {
      await task();
    } catch (error) {
      // Operational alerts must never undo a valid customer signup.
      console.error(`[owner-notifications] new customer signup ${channel} failed`, {
        userId: input.userId,
        timestamp: new Date().toISOString(),
        error: error instanceof Error ? error.message : `Unknown ${channel} error`,
      });
    }
  };

  const notifications = [
    notify("email", () => sendNewCustomerSignupNotificationEmail(input)),
  ];

  if (isSmsConfigured) {
    notifications.push(
      notify("sms", () => sendSms({
        to: ownerPhone,
        body: newCustomerSignupSms(input),
      }))
    );
  }

  await Promise.all(notifications);
}
