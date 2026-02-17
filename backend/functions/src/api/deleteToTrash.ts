import { onCall, HttpsError } from "firebase-functions/v2/https";
import { z } from "zod";
import { db } from "../lib/firebase";
import { requireUid } from "../lib/auth";
import { assertPlanOwner } from "../lib/plan";
import { deterministicDocId, ensureOpId } from "../lib/id";
import { entityPathFromParts, entityRefFromPath } from "../lib/entity";

const deleteToTrashSchema = z.object({
  opId: z.string().optional(),
  planId: z.string().min(1),
  entityType: z.enum(["plan", "event", "dayMemo", "journalDay", "journalEntry"]),
  entityId: z.string().optional()
});

export const deleteToTrash = onCall(async (req): Promise<{ trashId: string; deduped: boolean }> => {
  const uid = requireUid(req);
  const parsed = deleteToTrashSchema.safeParse(req.data);
  if (!parsed.success) {
    throw new HttpsError("invalid-argument", "Invalid deleteToTrash payload.");
  }

  await assertPlanOwner(db, parsed.data.planId, uid);
  const entityPath = entityPathFromParts(parsed.data.planId, parsed.data.entityType, parsed.data.entityId);
  const entityRef = entityRefFromPath(entityPath);
  const opId = ensureOpId(
    parsed.data.opId,
    uid,
    parsed.data.planId,
    parsed.data.entityType,
    parsed.data.entityId ?? "plan",
    Date.now().toString()
  );
  const trashId = deterministicDocId(uid, "trash", opId);
  const trashRef = db.collection("trash").doc(trashId);

  const existing = await trashRef.get();
  if (existing.exists) {
    return { trashId, deduped: true };
  }

  await db.runTransaction(async (tx) => {
    const targetSnap = await tx.get(entityRef);
    if (!targetSnap.exists) {
      throw new HttpsError("not-found", "Target entity not found.");
    }
    const target = targetSnap.data();
    if (!target || target.ownerUid !== uid) {
      throw new HttpsError("permission-denied", "Target entity access denied.");
    }

    const now = new Date();
    const purgeAt = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000);
    tx.set(trashRef, {
      ownerUid: uid,
      planId: parsed.data.planId,
      entityType: parsed.data.entityType,
      entityPath,
      state: "in_trash",
      snapshot: target,
      deletedAt: now,
      purgeAt,
      restoredAt: null,
      createdAt: now,
      updatedAt: now,
      schemaVersion: 1,
      version: 1,
      lastOpId: opId
    });

    tx.set(
      entityRef,
      {
        isDeleted: true,
        deletedAt: now,
        deletedBy: "user",
        updatedAt: now,
        updatedBy: "user"
      },
      { merge: true }
    );
  });

  return { trashId, deduped: false };
});
