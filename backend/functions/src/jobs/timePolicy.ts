import { HttpsError } from "firebase-functions/v2/https";
import type { JobPhase } from "./types";

export function normalizeDate(dateLocal: string): string {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(dateLocal)) {
    throw new HttpsError("invalid-argument", "dateLocal must be YYYY-MM-DD.");
  }
  return dateLocal;
}

export function parseGmtOffsetMinutes(offsetLabel: string): number {
  if (offsetLabel === "GMT" || offsetLabel === "UTC") {
    return 0;
  }
  const matched = offsetLabel.match(/^GMT([+-])(\d{1,2})(?::?(\d{2}))?$/);
  if (!matched) {
    throw new HttpsError("failed-precondition", `Unsupported timezone offset format: ${offsetLabel}`);
  }

  const sign = matched[1] === "-" ? -1 : 1;
  const hour = Number(matched[2]);
  const minute = Number(matched[3] ?? "0");
  return sign * (hour * 60 + minute);
}

function offsetMinutesForTimezone(timezone: string, atUtc: Date): number {
  let formatter: Intl.DateTimeFormat;
  try {
    formatter = new Intl.DateTimeFormat("en-US", {
      timeZone: timezone,
      timeZoneName: "shortOffset",
      hour: "2-digit",
      minute: "2-digit",
      hour12: false
    });
  } catch (_error) {
    throw new HttpsError("invalid-argument", `Invalid timezone: ${timezone}`);
  }
  const offsetLabel = formatter.formatToParts(atUtc).find((part) => part.type === "timeZoneName")?.value ?? "GMT";
  return parseGmtOffsetMinutes(offsetLabel);
}

function localWallClockToUtc(dateLocal: string, hour: number, minute: number, timezone: string): Date {
  const [year, month, day] = dateLocal.split("-").map((value) => Number(value));
  const localWallClockUtcMs = Date.UTC(year, month - 1, day, hour, minute, 0, 0);

  let utcMs = localWallClockUtcMs;
  for (let i = 0; i < 2; i += 1) {
    const offsetMinutes = offsetMinutesForTimezone(timezone, new Date(utcMs));
    utcMs = localWallClockUtcMs - offsetMinutes * 60 * 1000;
  }

  return new Date(utcMs);
}

export function defaultDueAtUtc(dateLocal: string, phase: JobPhase, timezone = "UTC"): Date {
  const normalized = normalizeDate(dateLocal);
  const hour = phase === "publish" ? 8 : 3;
  return localWallClockToUtc(normalized, hour, 0, timezone);
}
