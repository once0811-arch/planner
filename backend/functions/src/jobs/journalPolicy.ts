type EventStatus = "temporary" | "confirmed" | "completed" | null;
type EventCategory = "transport" | "stay" | "todo" | "shopping" | "food" | "etc" | null;

export interface JournalEventCandidate {
  id: string;
  status: EventStatus;
  importanceScore: number | null;
  startTimeLocal: string | null;
  category: EventCategory;
}

export function isEligibleForJournal(status: EventStatus): boolean {
  return status !== "temporary";
}

function baseStatusScore(status: EventStatus): number {
  if (status === "completed") {
    return 80;
  }
  if (status === "confirmed") {
    return 60;
  }
  if (status === null) {
    return 40;
  }
  return 0;
}

function categoryWeight(category: EventCategory): number {
  if (category === "transport" || category === "stay") {
    return 5;
  }
  return 0;
}

function eventPriorityScore(event: JournalEventCandidate): number {
  const numericImportance = Number(event.importanceScore);
  const importance = Number.isFinite(numericImportance) ? numericImportance : 0;
  const timeBonus = event.startTimeLocal ? 2 : 0;
  return importance + baseStatusScore(event.status) + categoryWeight(event.category) + timeBonus;
}

export function selectTopJournalEventIds(
  events: JournalEventCandidate[],
  maxCount = 5
): string[] {
  const ranked = events
    .filter((event) => isEligibleForJournal(event.status))
    .sort((a, b) => {
      const scoreGap = eventPriorityScore(b) - eventPriorityScore(a);
      if (scoreGap !== 0) {
        return scoreGap;
      }
      return a.id.localeCompare(b.id);
    });

  return ranked.slice(0, maxCount).map((event) => event.id);
}
