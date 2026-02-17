import { HttpsError } from "firebase-functions/v2/https";
import { db } from "../lib/firebase";
import { deterministicDocId } from "../lib/id";
import { asJournalJobDoc } from "./serializer";
import { shouldSkipForLock } from "./statePolicy";
import { defaultDueAtUtc } from "./timePolicy";
import type { JournalJobDoc } from "./types";

export { defaultDueAtUtc };

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
      publishAtLocal0800: defaultDueAtUtc(job.dateLocal, "publish", job.timezone),
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
    if (shouldSkipForLock(current.state)) {
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
