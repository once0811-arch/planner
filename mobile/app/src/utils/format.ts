export function formatPeriod(startDateLocal: string, endDateLocal: string) {
  return `${startDateLocal.replace(/-/g, ".")} - ${endDateLocal.replace(/-/g, ".")}`;
}

export function formatDateLabel(dateLocal: string) {
  const [year, month, day] = dateLocal.split("-");
  return `${year}.${month}.${day}`;
}

function pad2(value: number) {
  return String(value).padStart(2, "0");
}

function toUtcDateParts(dateLocal: string) {
  const [year, month, day] = dateLocal.split("-").map((value) => Number(value));
  return { year, month, day };
}

function formatUtcDateLocal(date: Date) {
  return `${date.getUTCFullYear()}-${pad2(date.getUTCMonth() + 1)}-${pad2(date.getUTCDate())}`;
}

export function dateRange(startDateLocal: string, endDateLocal: string) {
  const result: string[] = [];
  const start = toUtcDateParts(startDateLocal);
  const end = toUtcDateParts(endDateLocal);

  let cursorMs = Date.UTC(start.year, start.month - 1, start.day);
  const endMs = Date.UTC(end.year, end.month - 1, end.day);

  while (cursorMs <= endMs) {
    result.push(formatUtcDateLocal(new Date(cursorMs)));
    cursorMs += 24 * 60 * 60 * 1000;
  }
  return result;
}

export function formatDateFromMs(ms: number) {
  const date = new Date(ms);
  return `${date.getFullYear()}.${pad2(date.getMonth() + 1)}.${pad2(date.getDate())}`;
}
