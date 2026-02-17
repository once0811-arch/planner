import { createHash } from "node:crypto";

export function deterministicDocId(...parts: string[]): string {
  const normalized = parts.join("|");
  return createHash("sha256").update(normalized).digest("hex").slice(0, 28);
}

export function ensureOpId(opId: string | undefined, ...fallbackParts: string[]): string {
  if (opId && opId.trim().length > 0) {
    return opId.trim();
  }
  return deterministicDocId(...fallbackParts);
}
