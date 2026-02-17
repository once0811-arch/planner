import type { JournalEntry } from "../types/domain";

export function applyJournalTextUpdate(
  entries: JournalEntry[],
  targetId: string,
  draftText: string
): JournalEntry[] {
  const nextText = draftText.trim();
  if (!nextText) {
    return entries;
  }

  return entries.map((entry) =>
    entry.id === targetId
      ? {
          ...entry,
          text: nextText
        }
      : entry
  );
}

export function applyJournalDelete(entries: JournalEntry[], targetId: string): JournalEntry[] {
  return entries.filter((entry) => entry.id !== targetId);
}
