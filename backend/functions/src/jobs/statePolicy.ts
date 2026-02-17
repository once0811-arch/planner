import type { JobState } from "./types";
import { toDateOrNull } from "./dateValue";

export function shouldSkipForLock(state: JobState): boolean {
  return state === "done" || state === "deadletter" || state === "running";
}

export function shouldProcessDueJob(
  state: JobState,
  dueAtUtc: Date,
  nextRetryAt: Date | null,
  now: Date
): boolean {
  if (dueAtUtc > now) {
    return false;
  }
  if (state !== "failed") {
    return true;
  }
  if (!nextRetryAt) {
    return true;
  }
  return nextRetryAt <= now;
}

export function resolveDueWindow(
  rawDueAtUtc: unknown,
  rawNextRetryAt: unknown,
  now: Date
): { dueAtUtc: Date; nextRetryAt: Date | null } | null {
  const dueAtUtc = toDateOrNull(rawDueAtUtc, null);
  if (!dueAtUtc) {
    return null;
  }
  return {
    dueAtUtc,
    nextRetryAt: toDateOrNull(rawNextRetryAt, null)
  };
}
