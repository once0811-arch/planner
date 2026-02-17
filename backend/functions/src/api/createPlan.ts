import { onCall, HttpsError } from "firebase-functions/v2/https";
import { z } from "zod";
import { db } from "../lib/firebase";
import { requireUid } from "../lib/auth";
import { deterministicDocId, ensureOpId } from "../lib/id";

const createPlanSchema = z.object({
  opId: z.string().optional(),
  title: z.string().min(1),
  destination: z.string().min(1),
  startDateLocal: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  endDateLocal: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  planTimezone: z.string().min(1),
  isForeign: z.boolean().optional().default(false)
}).refine((input) => input.startDateLocal <= input.endDateLocal, {
  message: "startDateLocal must be <= endDateLocal.",
  path: ["startDateLocal"]
});

export const createPlan = onCall(async (req) => {
  const uid = requireUid(req);
  const parsed = createPlanSchema.safeParse(req.data);
  if (!parsed.success) {
    throw new HttpsError("invalid-argument", "Invalid createPlan payload.");
  }

  const opId = ensureOpId(parsed.data.opId, uid, parsed.data.title, parsed.data.startDateLocal, parsed.data.endDateLocal);
  const planId = deterministicDocId(uid, "plan", opId);
  const planRef = db.collection("plans").doc(planId);
  const existing = await planRef.get();
  if (existing.exists) {
    return { planId, deduped: true };
  }

  const now = new Date();
  await planRef.set({
    ownerUid: uid,
    title: parsed.data.title,
    destination: parsed.data.destination,
    startDateLocal: parsed.data.startDateLocal,
    endDateLocal: parsed.data.endDateLocal,
    planTimezone: parsed.data.planTimezone,
    isForeign: parsed.data.isForeign,
    journalEnabledAt: null,
    createdBy: "user",
    updatedBy: "user",
    source: "chat",
    createdAt: now,
    updatedAt: now,
    schemaVersion: 1,
    isDeleted: false,
    deletedAt: null,
    deletedBy: null,
    version: 1,
    lastOpId: opId
  });

  return { planId, deduped: false };
});
