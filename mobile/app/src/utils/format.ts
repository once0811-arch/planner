export function formatPeriod(startDateLocal: string, endDateLocal: string) {
  return `${startDateLocal.replace(/-/g, ".")} - ${endDateLocal.replace(/-/g, ".")}`;
}

export function formatDateLabel(dateLocal: string) {
  const [year, month, day] = dateLocal.split("-");
  return `${year}.${month}.${day}`;
}

export function dateRange(startDateLocal: string, endDateLocal: string) {
  const result: string[] = [];
  const cursor = new Date(`${startDateLocal}T00:00:00`);
  const end = new Date(`${endDateLocal}T00:00:00`);
  while (cursor <= end) {
    result.push(cursor.toISOString().slice(0, 10));
    cursor.setDate(cursor.getDate() + 1);
  }
  return result;
}

export function formatDateFromMs(ms: number) {
  return new Date(ms).toISOString().slice(0, 10).replace(/-/g, ".");
}
