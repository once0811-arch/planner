import type { DayMemo, JournalEntry, TrashItem, TravelPlan, TripEvent } from "../types/domain";

interface TrashFlowResult {
  journals: JournalEntry[];
  trashItems: TrashItem[];
}

export interface RestoreSnapshotState {
  journals: JournalEntry[];
  eventsByPlan: Record<string, TripEvent[]>;
  dayMemosByPlan: Record<string, DayMemo[]>;
  plans: TravelPlan[];
}

export interface RestoreSnapshotResult extends RestoreSnapshotState {
  trashItems: TrashItem[];
}

export function moveJournalToTrash(
  journals: JournalEntry[],
  trashItems: TrashItem[],
  journalId: string,
  nowMs = Date.now()
): TrashFlowResult {
  const target = journals.find((journal) => journal.id === journalId);
  if (!target) {
    return { journals, trashItems };
  }

  const purgeAtMs = nowMs + 30 * 24 * 60 * 60 * 1000;
  const trashItem: TrashItem = {
    id: `trash-journal-${target.id}-${nowMs}`,
    planId: target.planId,
    entityType: "journalEntry",
    title: `${target.dateLocal} ${target.type}`,
    deletedAtMs: nowMs,
    purgeAtMs,
    snapshotJournal: target
  };

  return {
    journals: journals.filter((journal) => journal.id !== journalId),
    trashItems: [trashItem, ...trashItems]
  };
}

export function restoreJournalFromTrash(
  journals: JournalEntry[],
  trashItems: TrashItem[],
  trashId: string
): TrashFlowResult {
  const target = trashItems.find((item) => item.id === trashId);
  if (!target || target.entityType !== "journalEntry" || !target.snapshotJournal) {
    return { journals, trashItems };
  }

  return {
    journals: [target.snapshotJournal, ...journals],
    trashItems: trashItems.filter((item) => item.id !== trashId)
  };
}

function upsertById<T extends { id: string }>(items: T[], nextItem: T): T[] {
  const others = items.filter((item) => item.id !== nextItem.id);
  return [nextItem, ...others];
}

export function restoreEntityFromTrash(
  state: RestoreSnapshotState,
  trashItems: TrashItem[],
  trashId: string
): RestoreSnapshotResult {
  const target = trashItems.find((item) => item.id === trashId);
  if (!target) {
    return { ...state, trashItems };
  }

  if (target.entityType === "journalEntry" && target.snapshotJournal) {
    return {
      ...state,
      journals: upsertById(state.journals, target.snapshotJournal),
      trashItems: trashItems.filter((item) => item.id !== trashId)
    };
  }

  if (target.entityType === "event" && target.snapshotEvent) {
    const planId = target.snapshotEvent.planId;
    return {
      ...state,
      eventsByPlan: {
        ...state.eventsByPlan,
        [planId]: upsertById(state.eventsByPlan[planId] ?? [], target.snapshotEvent)
      },
      trashItems: trashItems.filter((item) => item.id !== trashId)
    };
  }

  if (target.entityType === "dayMemo" && target.snapshotDayMemo) {
    const planId = target.snapshotDayMemo.planId;
    return {
      ...state,
      dayMemosByPlan: {
        ...state.dayMemosByPlan,
        [planId]: upsertById(
          (state.dayMemosByPlan[planId] ?? []).map((memo) => ({
            ...memo,
            id: `${memo.planId}-${memo.dateLocal}`
          })) as Array<DayMemo & { id: string }>,
          {
            ...target.snapshotDayMemo,
            id: `${target.snapshotDayMemo.planId}-${target.snapshotDayMemo.dateLocal}`
          }
        ).map((memo) => ({
          planId: memo.planId,
          dateLocal: memo.dateLocal,
          memo: memo.memo
        }))
      },
      trashItems: trashItems.filter((item) => item.id !== trashId)
    };
  }

  if (target.entityType === "plan" && target.snapshotPlan) {
    return {
      ...state,
      plans: upsertById(state.plans, target.snapshotPlan),
      trashItems: trashItems.filter((item) => item.id !== trashId)
    };
  }

  return {
    ...state,
    trashItems
  };
}
