import { onCall, HttpsError } from "firebase-functions/v2/https";
import { z } from "zod";
import { db } from "../lib/firebase";
import { requireUid } from "../lib/auth";
import { deterministicDocId, ensureOpId } from "../lib/id";
import { assertPlanOwner } from "../lib/plan";

const appendMessageSchema = z.object({
  opId: z.string().optional(),
  planId: z.string().min(1),
  role: z.enum(["user", "assistant", "system"]),
  text: z.string().optional(),
  imagePaths: z.array(z.string()).optional().default([]),
  linkedProposalId: z.string().optional()
});

export const appendMessage = onCall(async (req) => {
  const uid = requireUid(req);
  const parsed = appendMessageSchema.safeParse(req.data);
  if (!parsed.success) {
    throw new HttpsError("invalid-argument", "Invalid appendMessage payload.");
  }

  const planRef = await assertPlanOwner(db, parsed.data.planId, uid);
  const opId = ensureOpId(
    parsed.data.opId,
    uid,
    parsed.data.planId,
    parsed.data.role,
    Date.now().toString()
  );
  const messageId = deterministicDocId(uid, parsed.data.planId, "message", opId);
  const msgRef = planRef.collection("messages").doc(messageId);
  const existing = await msgRef.get();
  if (existing.exists) {
    return { messageId, deduped: true };
  }

  const now = new Date();
  await msgRef.set({
    ownerUid: uid,
    planId: parsed.data.planId,
    role: parsed.data.role,
    text: parsed.data.text ?? null,
    imagePaths: parsed.data.imagePaths,
    linkedProposalId: parsed.data.linkedProposalId ?? null,
    source: "chat",
    createdAt: now,
    updatedAt: now,
    createdBy: "user",
    updatedBy: "user",
    schemaVersion: 1,
    isDeleted: false,
    deletedAt: null,
    deletedBy: null,
    version: 1,
    lastOpId: opId
  });

  return { messageId, deduped: false };
});
