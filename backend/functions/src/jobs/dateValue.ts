interface TimestampLike {
  toDate: () => Date;
}

function isTimestampLike(value: unknown): value is TimestampLike {
  return typeof value === "object" && value !== null && "toDate" in value && typeof (value as TimestampLike).toDate === "function";
}

export function toDateOrNull(value: unknown, fallback: Date | null = null): Date | null {
  if (value === null || value === undefined) {
    return fallback;
  }
  if (value instanceof Date) {
    return value;
  }
  if (isTimestampLike(value)) {
    return value.toDate();
  }
  return fallback;
}
