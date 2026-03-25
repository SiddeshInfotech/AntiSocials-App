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

function getOffsetMinutesForTimezone(date: Date, timezone: string): number {
  const parts = new Intl.DateTimeFormat("en-US", {
    timeZone: timezone || env.DEFAULT_TIMEZONE,
    timeZoneName: "shortOffset",
    hour: "2-digit",
  }).formatToParts(date);

  const zoneName =
    parts.find((part) => part.type === "timeZoneName")?.value || "GMT+0";

  if (zoneName === "GMT" || zoneName === "UTC") {
    return 0;
  }

  const match = zoneName.match(/GMT([+-])(\d{1,2})(?::?(\d{2}))?/);
  if (!match) {
    return 0;
  }

  const sign = match[1] === "-" ? -1 : 1;
  const hours = Number(match[2]);
  const minutes = Number(match[3] || "0");
  return sign * (hours * 60 + minutes);
}

export function localDateTimeToUtc(
  localDate: string,
  hour: number,
  minute: number,
  timezone: string,
): Date {
  const hh = String(hour).padStart(2, "0");
  const mm = String(minute).padStart(2, "0");
  const asUtc = new Date(`${localDate}T${hh}:${mm}:00.000Z`);
  const offsetMinutes = getOffsetMinutesForTimezone(asUtc, timezone);
  return new Date(asUtc.getTime() - offsetMinutes * 60_000);
}
