type TargetType = "plan" | "event" | "dayMemo";

const MUTABLE_FIELDS: Record<TargetType, Set<string>> = {
  plan: new Set([
    "title",
    "destination",
    "startDateLocal",
    "endDateLocal",
    "planTimezone",
    "isForeign",
    "journalEnabledAt"
  ]),
  event: new Set([
    "title",
    "status",
    "category",
    "dateLocal",
    "startTimeLocal",
    "endTimeLocal",
    "timezone",
    "memo",
    "locationName",
    "lat",
    "lng",
    "colorId",
    "importanceScore",
    "departAtLocal",
    "departTz",
    "arriveAtLocal",
    "arriveTz"
  ]),
  dayMemo: new Set(["dateLocal", "memo"])
};

export function sanitizePatch(
  targetType: TargetType,
  patch: Record<string, unknown> | undefined
): Record<string, unknown> {
  const allowed = MUTABLE_FIELDS[targetType];
  if (!patch || !allowed) {
    return {};
  }

  const sanitized: Record<string, unknown> = {};
  for (const [key, value] of Object.entries(patch)) {
    if (allowed.has(key)) {
      sanitized[key] = value;
    }
  }
  return sanitized;
}

export function sanitizeDraftData(
  targetType: TargetType,
  draftData: Record<string, unknown> | undefined
): Record<string, unknown> {
  return sanitizePatch(targetType, draftData);
}

export function nextVersion(currentVersion: unknown): number {
  const parsed = Number(currentVersion);
  if (!Number.isFinite(parsed) || parsed < 1) {
    return 2;
  }
  return parsed + 1;
}
