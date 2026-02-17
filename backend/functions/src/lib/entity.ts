import { HttpsError } from "firebase-functions/v2/https";
import { db } from "./firebase";
import type { TrashEntityType } from "../types/contracts";

export function entityPathFromParts(
  planId: string,
  entityType: TrashEntityType,
  entityId?: string
): string {
  if (entityType === "plan") {
    return `plans/${planId}`;
  }

  if (!entityId) {
    throw new HttpsError("invalid-argument", `entityId is required for ${entityType}.`);
  }

  if (entityType === "event") {
    return `plans/${planId}/events/${entityId}`;
  }
  if (entityType === "dayMemo") {
    return `plans/${planId}/dayMemos/${entityId}`;
  }
  if (entityType === "journalDay") {
    return `plans/${planId}/journalDays/${entityId}`;
  }
  return `plans/${planId}/journalEntries/${entityId}`;
}

export function entityRefFromPath(entityPath: string) {
  return db.doc(entityPath);
}
