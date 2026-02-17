export type JobState = "queued" | "running" | "done" | "failed" | "deadletter";
export type JobPhase = "generate" | "publish" | "backfill";

export interface JournalJobDoc {
  planId: string;
  ownerUid: string;
  dateLocal: string;
  phase: JobPhase;
  timezone: string;
  dueAtUtc: Date;
  state: JobState;
  attemptCount: number;
  nextRetryAt: Date | null;
  idempotencyKey: string;
  lockOwner: string | null;
  lockAt: Date | null;
  lastError: string | null;
  createdAt: Date;
  updatedAt: Date;
}
