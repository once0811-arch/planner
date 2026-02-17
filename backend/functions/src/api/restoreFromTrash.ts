import { onCall, HttpsError } from "firebase-functions/v2/https";
import { z } from "zod";
import { db } from "../lib/firebase";
import { requireUid } from "../lib/auth";
import { ensureOpId } from "../lib/id";
import { entityRefFromPath } from "../lib/entity";

const restoreFromTrashSchema = z.object({
  opId: z.string().optional(),
  trashId: z.string().min(1)
});

export const restoreFromTrash = onCall(async (req): Promise<{ restored: boolean; deduped: boolean }> => {
  const uid = requireUid(req);
  const parsed = restoreFromTrashSchema.safeParse(req.data);
  if (!parsed.success) {
    throw new HttpsError("invalid-argument", "Invalid restoreFromTrash payload.");
  }

  const trashRef = db.collection("trash").doc(parsed.data.trashId);
  const opId = ensureOpId(parsed.data.opId, uid, parsed.data.trashId, Date.now().toString());

  let alreadyRestored = false;
  await db.runTransaction(async (tx) => {
    const trashSnap = await tx.get(trashRef);
    if (!trashSnap.exists) {
      throw new HttpsError("not-found", "trash item not found.");
    }
    const trash = trashSnap.data();
    if (!trash || trash.ownerUid !== uid) {
      throw new HttpsError("permission-denied", "trash item access denied.");
    }
    if (trash.state === "restored") {
      alreadyRestored = true;
      return;
    }
    if (trash.state !== "in_trash") {
      throw new HttpsError("failed-precondition", "trash item is not restorable.");
    }

    const targetRef = entityRefFromPath(String(trash.entityPath));
    const snapshot = (trash.snapshot as Record<string, unknown>) ?? {};
    const now = new Date();
    tx.set(targetRef, {
      ...snapshot,
      isDeleted: false,
      deletedAt: null,
      deletedBy: null,
      updatedAt: now,
      updatedBy: "user"
    }, { merge: true });

    tx.update(trashRef, {
      state: "restored",
      restoredAt: now,
      updatedAt: now,
      lastOpId: opId
    });
  });

  if (alreadyRestored) {
    return { restored: true, deduped: true };
  }

  return { restored: true, deduped: false };
});
