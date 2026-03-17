import { env } from "../config/env";

export function getLocalDateString(date: Date, timezone: string): string {
  return new Intl.DateTimeFormat("en-CA", {
    timeZone: timezone || env.DEFAULT_TIMEZONE,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(date);
}

export function dayStartUtcFromTimezone(date: Date, timezone: string): Date {
  const localDate = getLocalDateString(date, timezone);
  return new Date(`${localDate}T00:00:00.000Z`);
}
