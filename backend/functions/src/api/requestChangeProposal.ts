import { onCall, HttpsError } from "firebase-functions/v2/https";
import { z } from "zod";
import { db } from "../lib/firebase";
import { requireUid } from "../lib/auth";
import { assertPlanOwner } from "../lib/plan";
import { deterministicDocId, ensureOpId } from "../lib/id";

const operationSchema = z.object({
  op: z.enum(["create", "update", "delete"]),
  targetType: z.enum(["plan", "event", "dayMemo"]),
  targetId: z.string().nullable().optional(),
  patch: z.record(z.unknown()).optional(),
  draftData: z.record(z.unknown()).optional(),
  overrideAllowed: z.boolean().optional()
});

const requestChangeProposalSchema = z.object({
  opId: z.string().optional(),
  planId: z.string().min(1),
  proposalType: z.enum(["create", "update", "delete"]),
  bundleId: z.string().nullable().optional(),
  operations: z.array(operationSchema).min(1)
});

export const requestChangeProposal = onCall(async (req): Promise<{ proposalId: string; deduped: boolean }> => {
  const uid = requireUid(req);
  const parsed = requestChangeProposalSchema.safeParse(req.data);
  if (!parsed.success) {
    throw new HttpsError("invalid-argument", "Invalid requestChangeProposal payload.");
  }

  const planRef = await assertPlanOwner(db, parsed.data.planId, uid);
  const opId = ensureOpId(
    parsed.data.opId,
    uid,
    parsed.data.planId,
    parsed.data.proposalType,
    Date.now().toString()
  );
  const proposalId = deterministicDocId(uid, parsed.data.planId, "proposal", opId);
  const proposalRef = planRef.collection("changeProposals").doc(proposalId);
  const existing = await proposalRef.get();
  if (existing.exists) {
    return { proposalId, deduped: true };
  }

  const now = new Date();
  await proposalRef.set({
    ownerUid: uid,
    planId: parsed.data.planId,
    proposalType: parsed.data.proposalType,
    approvalState: "pending",
    bundleId: parsed.data.bundleId ?? null,
    operations: parsed.data.operations,
    snapshotBefore: null,
    snapshotAfter: null,
    requestedAt: now,
    approvedAt: null,
    rejectedAt: null,
    expiresAt: null,
    createdAt: now,
    updatedAt: now,
    createdBy: "system",
    updatedBy: "system",
    source: "chat",
    schemaVersion: 1,
    isDeleted: false,
    deletedAt: null,
    deletedBy: null,
    version: 1,
    lastOpId: opId
  });

  return { proposalId, deduped: false };
});
