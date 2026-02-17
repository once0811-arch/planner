import type { TravelPlan, TripEvent } from "../types/domain";

const DAY_MS = 24 * 60 * 60 * 1000;

export interface MonthGridCell {
  dateLocal: string;
  inCurrentMonth: boolean;
}

export interface OverallStackItem {
  planId: string;
  colorId: number;
  title: string;
  segment: "single" | "start" | "middle" | "end";
}

function pad2(value: number) {
  return String(value).padStart(2, "0");
}

function toDateParts(dateLocal: string) {
  const [year, month, day] = dateLocal.split("-").map((value) => Number(value));
  return { year, month, day };
}

function toDateLocal(date: Date) {
  return `${date.getUTCFullYear()}-${pad2(date.getUTCMonth() + 1)}-${pad2(date.getUTCDate())}`;
}

function startOfMonthUtc(dateLocal: string) {
  const { year, month } = toDateParts(dateLocal);
  return Date.UTC(year, month - 1, 1);
}

function isDateInRange(dateLocal: string, startDateLocal: string, endDateLocal: string) {
  return dateLocal >= startDateLocal && dateLocal <= endDateLocal;
}

export function buildMonthGrid(anchorDateLocal: string): MonthGridCell[] {
  const firstDayMs = startOfMonthUtc(anchorDateLocal);
  const firstWeekday = new Date(firstDayMs).getUTCDay();
  const startMs = firstDayMs - firstWeekday * DAY_MS;

  const { year, month } = toDateParts(anchorDateLocal);
  const currentMonth = `${year}-${pad2(month)}`;

  const cells: MonthGridCell[] = [];
  for (let index = 0; index < 42; index += 1) {
    const ms = startMs + index * DAY_MS;
    const dateLocal = toDateLocal(new Date(ms));
    cells.push({
      dateLocal,
      inCurrentMonth: dateLocal.startsWith(currentMonth)
    });
  }
  return cells;
}

export function buildOverallStacks(dateLocal: string, plans: TravelPlan[]): OverallStackItem[] {
  return plans
    .filter((plan) => isDateInRange(dateLocal, plan.startDateLocal, plan.endDateLocal))
    .map((plan) => ({
      planId: plan.id,
      colorId: plan.colorId,
      title: plan.title,
      segment:
        plan.startDateLocal === plan.endDateLocal
          ? "single"
          : dateLocal === plan.startDateLocal
            ? "start"
            : dateLocal === plan.endDateLocal
              ? "end"
              : "middle"
    }));
}

function eventSortKey(event: TripEvent) {
  return event.startTimeLocal ?? "99:99";
}

export function buildIndividualStacks(
  planId: string,
  dateLocal: string,
  eventsByPlan: Record<string, TripEvent[]>,
  maxPreview = 3
): {
  preview: TripEvent[];
  all: TripEvent[];
  extraCount: number;
} {
  const all = (eventsByPlan[planId] ?? [])
    .filter((event) => event.dateLocal === dateLocal)
    .sort((a, b) => {
      const keyGap = eventSortKey(a).localeCompare(eventSortKey(b));
      if (keyGap !== 0) {
        return keyGap;
      }
      return a.id.localeCompare(b.id);
    });

  const preview = all.slice(0, maxPreview);
  const extraCount = Math.max(all.length - preview.length, 0);
  return { preview, all, extraCount };
}
