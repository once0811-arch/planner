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

const approveChangeSchema = z.object({
  opId: z.string().optional(),
  planId: z.string().min(1),
  proposalId: z.string().min(1)
});

function targetRefFromOperation(
  planRef: FirebaseFirestore.DocumentReference,
  operation: z.infer<typeof operationSchema>,
  opIndex: number,
  proposalId: string
) {
  if (operation.targetType === "plan") {
    return planRef;
  }
  const collectionName = operation.targetType === "event" ? "events" : "dayMemos";
  const docId =
    operation.targetId ??
    deterministicDocId(planRef.id, proposalId, collectionName, opIndex.toString());
  return planRef.collection(collectionName).doc(docId);
}

export const approveChange = onCall(async (req) => {
  const uid = requireUid(req);
  const parsed = approveChangeSchema.safeParse(req.data);
  if (!parsed.success) {
    throw new HttpsError("invalid-argument", "Invalid approveChange payload.");
  }

  const planRef = await assertPlanOwner(db, parsed.data.planId, uid);
  const proposalRef = planRef.collection("changeProposals").doc(parsed.data.proposalId);
  const opId = ensureOpId(
    parsed.data.opId,
    uid,
    parsed.data.planId,
    parsed.data.proposalId,
    Date.now().toString()
  );

  await db.runTransaction(async (tx) => {
    const proposalSnap = await tx.get(proposalRef);
    if (!proposalSnap.exists) {
      throw new HttpsError("not-found", "Proposal not found.");
    }

    const proposal = proposalSnap.data();
    if (!proposal || proposal.ownerUid !== uid) {
      throw new HttpsError("permission-denied", "Proposal access denied.");
    }
    if (proposal.approvalState !== "pending") {
      throw new HttpsError("failed-precondition", "Proposal is not pending.");
    }

    const operationsRaw = Array.isArray(proposal.operations) ? proposal.operations : [];
    const operations = z.array(operationSchema).safeParse(operationsRaw);
    if (!operations.success) {
      throw new HttpsError("failed-precondition", "Invalid proposal operation format.");
    }

    const now = new Date();
    for (const [opIndex, operation] of operations.data.entries()) {
      const targetRef = targetRefFromOperation(planRef, operation, opIndex, parsed.data.proposalId);
      const targetSnap = await tx.get(targetRef);
      const source = operation.targetType === "plan" ? "chat" : "calendar";

      if (operation.op === "create") {
        if (operation.targetType === "plan") {
          throw new HttpsError("invalid-argument", "plan create is not supported in approveChange.");
        }
        tx.set(targetRef, {
          ownerUid: uid,
          planId: planRef.id,
          ...(operation.draftData ?? {}),
          createdAt: now,
          updatedAt: now,
          createdBy: "system",
          updatedBy: "system",
          source,
          schemaVersion: 1,
          isDeleted: false,
          deletedAt: null,
          deletedBy: null,
          version: 1
        });
        continue;
      }

      if (!targetSnap.exists) {
        throw new HttpsError("not-found", "Operation target not found.");
      }

      if (operation.op === "update") {
        tx.set(
          targetRef,
          {
            ...(operation.patch ?? {}),
            updatedAt: now,
            updatedBy: "system",
            source
          },
          { merge: true }
        );
        continue;
      }

      tx.set(
        targetRef,
        {
          isDeleted: true,
          deletedAt: now,
          deletedBy: "system",
          updatedAt: now,
          updatedBy: "system",
          source
        },
        { merge: true }
      );
    }

    tx.update(proposalRef, {
      approvalState: "approved",
      approvedAt: now,
      updatedAt: now,
      updatedBy: "user",
      source: "chat",
      version: Number(proposal.version ?? 1) + 1,
      lastOpId: opId
    });
  });

  return { proposalId: parsed.data.proposalId, approvalState: "approved" };
});
