import { onCall, HttpsError } from "firebase-functions/v2/https";
import { z } from "zod";
import { db } from "../lib/firebase";
import { requireUid } from "../lib/auth";
import { assertPlanOwner } from "../lib/plan";
import { deterministicDocId, ensureOpId } from "../lib/id";
import { defaultDueAtUtc } from "./runner";

const enqueueJournalJobSchema = z.object({
  opId: z.string().optional(),
  planId: z.string().min(1),
  dateLocal: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  phase: z.enum(["generate", "publish", "backfill"]),
  timezone: z.string().optional(),
  dueAtUtcMs: z.number().int().nonnegative().optional()
});

export const enqueueJournalJob = onCall(
  async (req): Promise<{ jobId: string; deduped: boolean }> => {
    const uid = requireUid(req);
    const parsed = enqueueJournalJobSchema.safeParse(req.data);
    if (!parsed.success) {
      throw new HttpsError("invalid-argument", "Invalid enqueueJournalJob payload.");
    }

    const planRef = await assertPlanOwner(db, parsed.data.planId, uid);
    const planSnap = await planRef.get();
    const planTimezone = String(planSnap.get("planTimezone") ?? "UTC");
    const timezone = parsed.data.timezone ?? planTimezone;
    const dueAtUtc =
      parsed.data.dueAtUtcMs !== undefined
        ? new Date(parsed.data.dueAtUtcMs)
        : defaultDueAtUtc(parsed.data.dateLocal, parsed.data.phase);

    const idempotencyKey = `${parsed.data.planId}|${parsed.data.dateLocal}|${parsed.data.phase}`;
    const opId = ensureOpId(parsed.data.opId, uid, idempotencyKey, Date.now().toString());
    const jobId = deterministicDocId(idempotencyKey);
    const jobRef = db.collection("journalJobs").doc(jobId);
    const existing = await jobRef.get();
    if (existing.exists) {
      return { jobId, deduped: true };
    }

    const now = new Date();
    await jobRef.set({
      planId: parsed.data.planId,
      ownerUid: uid,
      dateLocal: parsed.data.dateLocal,
      phase: parsed.data.phase,
      timezone,
      dueAtUtc,
      state: "queued",
      attemptCount: 0,
      nextRetryAt: null,
      idempotencyKey,
      lockOwner: null,
      lockAt: null,
      lastError: null,
      createdAt: now,
      updatedAt: now,
      lastOpId: opId
    });

    return { jobId, deduped: false };
  }
);
