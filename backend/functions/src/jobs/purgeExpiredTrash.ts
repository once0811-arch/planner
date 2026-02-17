import { onSchedule } from "firebase-functions/v2/scheduler";
import { db } from "../lib/firebase";
import { isPurgeTarget, shouldContinuePurge } from "./trashPolicy";
import { toDateOrNull } from "./dateValue";

export const purgeExpiredTrash = onSchedule({
  schedule: "every day 03:00",
  timeZone: "Asia/Seoul"
}, async () => {
  const now = new Date();
  const pageSize = 500;
  let checked = 0;
  let purged = 0;
  let shouldContinue = true;

  while (shouldContinue) {
    const snap = await db
      .collection("trash")
      .where("state", "==", "in_trash")
      .where("purgeAt", "<=", now)
      .limit(pageSize)
      .get();

    if (snap.empty) {
      break;
    }

    checked += snap.size;

    const batch = db.batch();
    let pagePurged = 0;
    for (const doc of snap.docs) {
      const state = String(doc.get("state") ?? "");
      const purgeAt = toDateOrNull(doc.get("purgeAt"), null);
      if (!isPurgeTarget(state, purgeAt, now)) {
        continue;
      }
      batch.delete(doc.ref);
      pagePurged += 1;
    }

    if (pagePurged > 0) {
      await batch.commit();
      purged += pagePurged;
    }

    shouldContinue = shouldContinuePurge(snap.size, pageSize);
  }

  console.info("purgeExpiredTrash", {
    checked,
    purged
  });
});
