export function isPurgeTarget(state: string, purgeAt: Date | null, now: Date): boolean {
  if (state !== "in_trash") {
    return false;
  }
  if (!purgeAt) {
    return false;
  }
  return purgeAt <= now;
}

export function shouldContinuePurge(processedCount: number, pageSize: number): boolean {
  return processedCount === pageSize;
}
