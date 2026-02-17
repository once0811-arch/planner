import { onCall, HttpsError } from "firebase-functions/v2/https";
import { z } from "zod";
import { db } from "../lib/firebase";
import { requireUid } from "../lib/auth";
import { runJournalJobById } from "./runner";

const runJournalJobSchema = z.object({
  jobId: z.string().min(1)
});

export const runJournalJob = onCall(async (req) => {
  const uid = requireUid(req);
  const parsed = runJournalJobSchema.safeParse(req.data);
  if (!parsed.success) {
    throw new HttpsError("invalid-argument", "Invalid runJournalJob payload.");
  }

  const jobRef = db.collection("journalJobs").doc(parsed.data.jobId);
  const jobSnap = await jobRef.get();
  if (!jobSnap.exists) {
    throw new HttpsError("not-found", "journal job not found.");
  }
  if (jobSnap.get("ownerUid") !== uid) {
    throw new HttpsError("permission-denied", "journal job access denied.");
  }

  const result = await runJournalJobById(parsed.data.jobId, `user:${uid}`);
  return { jobId: parsed.data.jobId, result };
});
