import { onSchedule } from "firebase-functions/v2/scheduler";
import { db } from "../lib/firebase";
import { defaultDueAtUtc } from "./runner";
import { deterministicDocId } from "../lib/id";

export const reconcileMissingJournalJobs = onSchedule("every day 01:00", async () => {
  const todayLocal = new Date().toISOString().slice(0, 10);
  const plansSnap = await db
    .collection("plans")
    .where("isDeleted", "==", false)
    .where("journalEnabledAt", "!=", null)
    .limit(100)
    .get();

  let created = 0;
  for (const planDoc of plansSnap.docs) {
    const plan = planDoc.data();
    const ownerUid = String(plan.ownerUid ?? "");
    const timezone = String(plan.planTimezone ?? "UTC");
    for (const phase of ["generate", "publish"] as const) {
      const idempotencyKey = `${planDoc.id}|${todayLocal}|${phase}`;
      const jobId = deterministicDocId(idempotencyKey);
      const jobRef = db.collection("journalJobs").doc(jobId);
      const existing = await jobRef.get();
      if (existing.exists) {
        continue;
      }

      const now = new Date();
      await jobRef.set({
        planId: planDoc.id,
        ownerUid,
        dateLocal: todayLocal,
        phase,
        timezone,
        dueAtUtc: defaultDueAtUtc(todayLocal, phase),
        state: "queued",
        attemptCount: 0,
        nextRetryAt: null,
        idempotencyKey,
        lockOwner: null,
        lockAt: null,
        lastError: null,
        createdAt: now,
        updatedAt: now
      });
      created += 1;
    }
  }
  console.info("reconcileMissingJournalJobs", {
    scannedPlans: plansSnap.size,
    createdJobs: created
  });
});
