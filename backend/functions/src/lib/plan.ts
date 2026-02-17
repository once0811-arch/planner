import { HttpsError } from "firebase-functions/v2/https";
import type { Firestore } from "firebase-admin/firestore";

export async function assertPlanOwner(db: Firestore, planId: string, uid: string) {
  const planRef = db.collection("plans").doc(planId);
  const planSnap = await planRef.get();
  if (!planSnap.exists || planSnap.get("ownerUid") !== uid) {
    throw new HttpsError("permission-denied", "Plan not found or access denied.");
  }
  return planRef;
}
