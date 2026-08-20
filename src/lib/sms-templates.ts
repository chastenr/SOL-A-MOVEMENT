import { formatManilaTime } from "@/lib/manila-time";

const MAX_SMS_LENGTH = 160;

function compact(value: string, max: number): string {
  const normalized = value.replace(/\s+/g, " ").trim();
  return normalized.length <= max ? normalized : `${normalized.slice(0, Math.max(max - 3, 0)).trim()}...`;
}

function finish(message: string): string {
  return message.length <= MAX_SMS_LENGTH ? message : `${message.slice(0, MAX_SMS_LENGTH - 3).trim()}...`;
}

function classAndCoach(className: string, coachName: string): { className: string; coachName: string } {
  return { className: compact(className, 34), coachName: compact(coachName || "TBA", 22) };
}

export function bookingConfirmationSms(input: {
  className: string;
  coachName: string;
  date: string;
  startAt: Date | string;
}): string {
  const names = classAndCoach(input.className, input.coachName);
  return finish(
    `VEORA: ${names.className} booked ${input.date} at ${formatManilaTime(input.startAt)} PHT with Coach ${names.coachName}. Arrive 10 min early.`
  );
}

export function bookingReminderSms(input: {
  type: "reminder_24h" | "reminder_2h";
  className: string;
  coachName: string;
  startAt: Date | string;
}): string {
  const names = classAndCoach(input.className, input.coachName);
  const when = input.type === "reminder_24h" ? "tomorrow" : "today";
  return finish(
    `VEORA reminder: ${names.className} is ${when} at ${formatManilaTime(input.startAt)} PHT with Coach ${names.coachName}. Arrive 10 min early.`
  );
}

export function bookingCancellationSms(input: {
  className: string;
  date: string;
  startAt: Date | string;
}): string {
  return finish(
    `VEORA: Your ${compact(input.className, 42)} booking on ${input.date} at ${formatManilaTime(input.startAt)} PHT was cancelled. You can rebook at VEORA.ph.`
  );
}

export function newCustomerSignupSms(input: {
  firstName: string;
  lastName: string;
  email: string;
  mobileNumber: string;
}): string {
  const fullName = compact(`${input.firstName} ${input.lastName}`, 38);
  const email = compact(input.email, 58);
  return finish(
    `VEORA new signup: ${fullName}. Email: ${email}. Mobile: ${input.mobileNumber}.`
  );
}

export const SMS_MAX_LENGTH = MAX_SMS_LENGTH;
