import type { ProposalOperationPayload, TripEvent } from "../types/domain";

interface ApplyOptions {
  nowMs?: number;
  colorId?: number;
}

function nextEventId(nowMs: number, index: number) {
  return `e-generated-${nowMs}-${index}`;
}

function patchEvent(event: TripEvent, draft: Partial<TripEvent>): TripEvent {
  return {
    ...event,
    ...draft,
    status: draft.status ?? event.status ?? "confirmed"
  };
}

export function applyProposalOperations(
  planId: string,
  events: TripEvent[],
  operations: ProposalOperationPayload[],
  options: ApplyOptions = {}
): TripEvent[] {
  const nowMs = options.nowMs ?? Date.now();
  const fallbackColorId = options.colorId ?? 0;
  let nextEvents = [...events];
  let createIndex = 0;

  for (const operation of operations) {
    if (operation.action === "delete") {
      if (operation.targetEventId) {
        nextEvents = nextEvents.filter((event) => event.id !== operation.targetEventId);
      }
      continue;
    }

    if (operation.action === "update") {
      if (!operation.targetEventId) {
        continue;
      }
      nextEvents = nextEvents.map((event) =>
        event.id === operation.targetEventId ? patchEvent(event, operation.draft) : event
      );
      continue;
    }

    const title = operation.draft.title?.trim();
    const dateLocal = operation.draft.dateLocal;
    if (!title || !dateLocal) {
      continue;
    }

    const newEvent: TripEvent = {
      id: nextEventId(nowMs, createIndex),
      planId,
      title,
      dateLocal,
      startTimeLocal: operation.draft.startTimeLocal,
      endTimeLocal: operation.draft.endTimeLocal,
      locationLabel: operation.draft.locationLabel,
      category: operation.draft.category ?? null,
      status: operation.draft.status ?? "confirmed",
      memo: operation.draft.memo,
      colorId: operation.draft.colorId ?? fallbackColorId
    };

    createIndex += 1;
    nextEvents = [...nextEvents, newEvent];
  }

  return nextEvents;
}
