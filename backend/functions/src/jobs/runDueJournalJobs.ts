import { onSchedule } from "firebase-functions/v2/scheduler";
import { db } from "../lib/firebase";
import { runJournalJobById } from "./runner";
import { resolveDueWindow, shouldProcessDueJob } from "./statePolicy";

export const runDueJournalJobs = onSchedule("every 5 minutes", async () => {
  const now = new Date();
  const dueJobsSnap = await db
    .collection("journalJobs")
    .where("state", "in", ["queued", "failed"])
    .where("dueAtUtc", "<=", now)
    .orderBy("dueAtUtc", "asc")
    .limit(20)
    .get();

  let processed = 0;
  let failed = 0;
  let skipped = 0;
  let invalid = 0;
  for (const doc of dueJobsSnap.docs) {
    const state = String(doc.get("state")) as "queued" | "failed";
    const window = resolveDueWindow(doc.get("dueAtUtc"), doc.get("nextRetryAt"), now);
    if (!window) {
      invalid += 1;
      continue;
    }
    if (!shouldProcessDueJob(state, window.dueAtUtc, window.nextRetryAt, now)) {
      skipped += 1;
      continue;
    }

    try {
      const result = await runJournalJobById(doc.id, "scheduler:runDueJournalJobs");
      if (result === "done") {
        processed += 1;
      }
    } catch (_error) {
      failed += 1;
    }
  }
  console.info("runDueJournalJobs", {
    checked: dueJobsSnap.size,
    processed,
    failed,
    skipped,
    invalid
  });
});
