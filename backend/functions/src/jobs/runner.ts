import { HttpsError } from "firebase-functions/v2/https";
import { db } from "../lib/firebase";
import { deterministicDocId } from "../lib/id";
import { asJournalJobDoc } from "./serializer";
import { shouldSkipForLock } from "./statePolicy";
import { defaultDueAtUtc } from "./timePolicy";
import type { JournalJobDoc } from "./types";
import { selectTopJournalEventIds } from "./journalPolicy";
import { composeJournalDay, type JournalComposerEvent } from "./journalComposer";

export { defaultDueAtUtc };

function buildJournalDayRef(planId: string, dateLocal: string) {
  return db.collection("plans").doc(planId).collection("journalDays").doc(dateLocal);
}

function normalizeStatus(value: unknown): "temporary" | "confirmed" | "completed" | null {
  if (value === "temporary" || value === "confirmed" || value === "completed") {
    return value;
  }
  return null;
}

function normalizeCategory(
  value: unknown
): "transport" | "stay" | "todo" | "shopping" | "food" | "etc" | null {
  if (
    value === "transport" ||
    value === "stay" ||
    value === "todo" ||
    value === "shopping" ||
    value === "food" ||
    value === "etc"
  ) {
    return value;
  }
  return null;
}

interface DailyEventSignal extends JournalComposerEvent {
  importanceScore: number | null;
}

async function selectDailyEventSignals(job: JournalJobDoc): Promise<DailyEventSignal[]> {
  const eventsSnap = await db
    .collection("plans")
    .doc(job.planId)
    .collection("events")
    .where("isDeleted", "==", false)
    .where("dateLocal", "==", job.dateLocal)
    .get();

  return eventsSnap.docs.map((doc) => {
    const importanceRaw = Number(doc.get("importanceScore"));
    return {
      id: doc.id,
      title: typeof doc.get("title") === "string" ? String(doc.get("title")) : "일정",
      status: normalizeStatus(doc.get("status")),
      importanceScore: Number.isFinite(importanceRaw) ? importanceRaw : null,
      startTimeLocal: typeof doc.get("startTimeLocal") === "string" ? String(doc.get("startTimeLocal")) : null,
      category: normalizeCategory(doc.get("category")),
      locationLabel: typeof doc.get("locationLabel") === "string" ? String(doc.get("locationLabel")) : null
    };
  });
}

async function readGenerateWithoutData(ownerUid: string): Promise<boolean> {
  const settingsSnap = await db.collection("settings").doc(ownerUid).get();
  const flag = settingsSnap.get("journalGenerateWithoutData");
  if (typeof flag === "boolean") {
    return flag;
  }
  return true;
}

async function readPlanTitle(planId: string): Promise<string> {
  const planSnap = await db.collection("plans").doc(planId).get();
  const title = planSnap.get("title");
  if (typeof title === "string" && title.trim().length > 0) {
    return title;
  }
  return "여행 플랜";
}

async function readPhotoSignals(planId: string, dateLocal: string): Promise<{
  photoCount: number;
  topLocationLabel: string | null;
  coverImagePath: string | null;
}> {
  const snap = await db
    .collection("plans")
    .doc(planId)
    .collection("photoCandidates")
    .where("isDeleted", "==", false)
    .where("dateLocal", "==", dateLocal)
    .limit(40)
    .get();

  let topLocationLabel: string | null = null;
  let coverImagePath: string | null = null;
  for (const doc of snap.docs) {
    if (!topLocationLabel) {
      const locationLabel = doc.get("locationLabel");
      if (typeof locationLabel === "string" && locationLabel.trim().length > 0) {
        topLocationLabel = locationLabel;
      }
    }
    if (!coverImagePath) {
      const imagePath = doc.get("imagePath");
      if (typeof imagePath === "string" && imagePath.trim().length > 0) {
        coverImagePath = imagePath;
      }
    }
  }

  return {
    photoCount: snap.size,
    topLocationLabel,
    coverImagePath
  };
}

async function executeGenerateLike(job: JournalJobDoc) {
  const now = new Date();
  const journalDayRef = buildJournalDayRef(job.planId, job.dateLocal);
  const eventSignals = await selectDailyEventSignals(job);
  const selectedEventIds = selectTopJournalEventIds(
    eventSignals.map((event) => ({
      id: event.id,
      status: event.status,
      importanceScore: event.importanceScore,
      startTimeLocal: event.startTimeLocal,
      category: event.category
    })),
    5
  );
  const selectedEvents = selectedEventIds
    .map((eventId) => eventSignals.find((event) => event.id === eventId))
    .filter((event): event is DailyEventSignal => Boolean(event));
  const [planTitle, generateWithoutData, photoSignals] = await Promise.all([
    readPlanTitle(job.planId),
    readGenerateWithoutData(job.ownerUid),
    readPhotoSignals(job.planId, job.dateLocal)
  ]);
  const composed = composeJournalDay({
    dateLocal: job.dateLocal,
    planTitle,
    events: selectedEvents,
    photoCount: photoSignals.photoCount,
    topLocationLabel: photoSignals.topLocationLabel,
    generateWithoutData
  });

  await journalDayRef.set(
    {
      ownerUid: job.ownerUid,
      planId: job.planId,
      dateLocal: job.dateLocal,
      state: "draft",
      publishAtLocal0800: defaultDueAtUtc(job.dateLocal, "publish", job.timezone),
      publishedAt: null,
      summary: composed.summary,
      entryText: composed.entryText,
      selectedEventIds,
      photoCount: photoSignals.photoCount,
      topLocationLabel: photoSignals.topLocationLabel,
      coverImagePath: photoSignals.coverImagePath,
      generationInputHash: deterministicDocId(job.planId, job.dateLocal, "journal-input"),
      failureReasonCode: composed.state === "insufficient_data" ? "insufficient_data" : null,
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
      updatedAt: now
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
