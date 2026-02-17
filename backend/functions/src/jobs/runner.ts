import { HttpsError } from "firebase-functions/v2/https";
import { db } from "../lib/firebase";
import { deterministicDocId } from "../lib/id";

type JobState = "queued" | "running" | "done" | "failed" | "deadletter";
type JobPhase = "generate" | "publish" | "backfill";

interface JournalJobDoc {
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

function asJournalJobDoc(raw: FirebaseFirestore.DocumentData | undefined): JournalJobDoc {
  if (!raw) {
    throw new HttpsError("not-found", "journal job not found.");
  }
  return {
    planId: String(raw.planId ?? ""),
    ownerUid: String(raw.ownerUid ?? ""),
    dateLocal: String(raw.dateLocal ?? ""),
    phase: raw.phase as JobPhase,
    timezone: String(raw.timezone ?? "UTC"),
    dueAtUtc: (raw.dueAtUtc as Date) ?? new Date(),
    state: raw.state as JobState,
    attemptCount: Number(raw.attemptCount ?? 0),
    nextRetryAt: (raw.nextRetryAt as Date | null) ?? null,
    idempotencyKey: String(raw.idempotencyKey ?? ""),
    lockOwner: (raw.lockOwner as string | null) ?? null,
    lockAt: (raw.lockAt as Date | null) ?? null,
    lastError: (raw.lastError as string | null) ?? null,
    createdAt: (raw.createdAt as Date) ?? new Date(),
    updatedAt: (raw.updatedAt as Date) ?? new Date()
  };
}

function normalizeDate(dateLocal: string): string {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(dateLocal)) {
    throw new HttpsError("invalid-argument", "dateLocal must be YYYY-MM-DD.");
  }
  return dateLocal;
}

export function defaultDueAtUtc(dateLocal: string, phase: JobPhase): Date {
  const normalized = normalizeDate(dateLocal);
  const hour = phase === "publish" ? 8 : 3;
  return new Date(`${normalized}T${hour.toString().padStart(2, "0")}:00:00.000Z`);
}

function buildJournalDayRef(planId: string, dateLocal: string) {
  return db.collection("plans").doc(planId).collection("journalDays").doc(dateLocal);
}

async function executeGenerateLike(job: JournalJobDoc) {
  const now = new Date();
  const journalDayRef = buildJournalDayRef(job.planId, job.dateLocal);
  await journalDayRef.set(
    {
      ownerUid: job.ownerUid,
      planId: job.planId,
      dateLocal: job.dateLocal,
      state: "draft",
      publishAtLocal0800: defaultDueAtUtc(job.dateLocal, "publish"),
      publishedAt: null,
      summary: "정보가 부족해 일지를 만들지 못 했어요",
      selectedEventIds: [],
      generationInputHash: deterministicDocId(job.planId, job.dateLocal, "journal-input"),
      failureReasonCode: null,
      createdAt: now,
      updatedAt: now,
      schemaVersion: 1,
      isDeleted: false,
      version: 1
    },
    { merge: true }
  );
}

async function executePublish(job: JournalJobDoc) {
  const now = new Date();
  const journalDayRef = buildJournalDayRef(job.planId, job.dateLocal);
  const snap = await journalDayRef.get();
  if (!snap.exists) {
    await executeGenerateLike(job);
  }

  await journalDayRef.set(
    {
      state: "published",
      publishedAt: now,
      updatedAt: now,
      failureReasonCode: null
    },
    { merge: true }
  );
}

async function runJobBody(job: JournalJobDoc) {
  if (job.phase === "publish") {
    await executePublish(job);
    return;
  }
  await executeGenerateLike(job);
}

export async function runJournalJobById(
  jobId: string,
  actorId: string
): Promise<"done" | "skipped"> {
  const jobRef = db.collection("journalJobs").doc(jobId);
  let lockedJob: JournalJobDoc | null = null;

  await db.runTransaction(async (tx) => {
    const jobSnap = await tx.get(jobRef);
    if (!jobSnap.exists) {
      throw new HttpsError("not-found", "journal job not found.");
    }

    const current = asJournalJobDoc(jobSnap.data());
    if (current.state === "done" || current.state === "deadletter" || current.state === "running") {
      return;
    }

    const now = new Date();
    tx.update(jobRef, {
      state: "running",
      lockOwner: actorId,
      lockAt: now,
      updatedAt: now
    });
    lockedJob = { ...current, state: "running", lockOwner: actorId, lockAt: now };
  });

  if (!lockedJob) {
    return "skipped";
  }
  const runningJob: JournalJobDoc = lockedJob;

  try {
    await runJobBody(runningJob);
    await jobRef.update({
      state: "done",
      lockOwner: null,
      lockAt: null,
      updatedAt: new Date()
    });
    return "done";
  } catch (error) {
    const attempts = runningJob.attemptCount + 1;
    const now = new Date();
    await jobRef.update({
      state: attempts >= 3 ? "deadletter" : "failed",
      attemptCount: attempts,
      nextRetryAt: attempts >= 3 ? null : new Date(now.getTime() + 5 * 60 * 1000),
      lastError: error instanceof Error ? error.message : "unknown error",
      lockOwner: null,
      lockAt: null,
      updatedAt: now
    });
    throw error;
  }
}
