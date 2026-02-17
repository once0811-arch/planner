import { HttpsError } from "firebase-functions/v2/https";
import type { JournalJobDoc } from "./types";
import { toDateOrNull } from "./dateValue";

export function asJournalJobDoc(raw: FirebaseFirestore.DocumentData | undefined): JournalJobDoc {
  if (!raw) {
    throw new HttpsError("not-found", "journal job not found.");
  }
  return {
    planId: String(raw.planId ?? ""),
    ownerUid: String(raw.ownerUid ?? ""),
    dateLocal: String(raw.dateLocal ?? ""),
    phase: raw.phase as JournalJobDoc["phase"],
    timezone: String(raw.timezone ?? "UTC"),
    dueAtUtc: (toDateOrNull(raw.dueAtUtc, new Date()) as Date),
    state: raw.state as JournalJobDoc["state"],
    attemptCount: Number(raw.attemptCount ?? 0),
    nextRetryAt: toDateOrNull(raw.nextRetryAt, null),
    idempotencyKey: String(raw.idempotencyKey ?? ""),
    lockOwner: (raw.lockOwner as string | null) ?? null,
    lockAt: toDateOrNull(raw.lockAt, null),
    lastError: (raw.lastError as string | null) ?? null,
    createdAt: (toDateOrNull(raw.createdAt, new Date()) as Date),
    updatedAt: (toDateOrNull(raw.updatedAt, new Date()) as Date)
  };
}
