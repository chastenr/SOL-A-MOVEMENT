const MANILA_TIME_ZONE = "Asia/Manila";

type DateValue = Date | string | number;

function toDate(value: DateValue): Date {
  return value instanceof Date ? value : new Date(value);
}

export function formatManilaTime(value: DateValue): string {
  return new Intl.DateTimeFormat("en-PH", {
    timeZone: MANILA_TIME_ZONE,
    hour: "numeric",
    minute: "2-digit",
  }).format(toDate(value));
}

export function formatManilaDate(value: DateValue): string {
  return new Intl.DateTimeFormat("en-PH", {
    timeZone: MANILA_TIME_ZONE,
    month: "short",
    day: "numeric",
    year: "numeric",
  }).format(toDate(value));
}

export function formatManilaFullDate(value: DateValue): string {
  return new Intl.DateTimeFormat("en-PH", {
    timeZone: MANILA_TIME_ZONE,
    weekday: "long",
    month: "long",
    day: "numeric",
    year: "numeric",
  }).format(toDate(value));
}

export function formatManilaDateTime(value: DateValue): string {
  return `${formatManilaDate(value)} · ${formatManilaTime(value)}`;
}

export function formatManilaFullDateTime(value: DateValue): string {
  return `${formatManilaFullDate(value)} at ${formatManilaTime(value)}`;
}
