const test = require("node:test");
const assert = require("node:assert/strict");

const { shouldSkipForLock, shouldProcessDueJob, resolveDueWindow } = require("../lib/jobs/statePolicy.js");
const { asJournalJobDoc } = require("../lib/jobs/serializer.js");
const { toDateOrNull } = require("../lib/jobs/dateValue.js");

test("shouldSkipForLock skips done/deadletter/running and allows queued/failed", () => {
  assert.equal(shouldSkipForLock("done"), true);
  assert.equal(shouldSkipForLock("deadletter"), true);
  assert.equal(shouldSkipForLock("running"), true);
  assert.equal(shouldSkipForLock("queued"), false);
  assert.equal(shouldSkipForLock("failed"), false);
});

test("asJournalJobDoc converts timestamp-like values to Date", () => {
  const raw = {
    planId: "plan-1",
    ownerUid: "user-1",
    dateLocal: "2026-02-17",
    phase: "generate",
    timezone: "Asia/Seoul",
    dueAtUtc: { toDate: () => new Date("2026-02-16T18:00:00.000Z") },
    state: "queued",
    attemptCount: 0,
    nextRetryAt: null,
    idempotencyKey: "key",
    lockOwner: null,
    lockAt: null,
    lastError: null,
    createdAt: { toDate: () => new Date("2026-02-16T17:00:00.000Z") },
    updatedAt: { toDate: () => new Date("2026-02-16T17:00:00.000Z") }
  };

  const parsed = asJournalJobDoc(raw);
  assert.equal(parsed.planId, "plan-1");
  assert.equal(parsed.dueAtUtc.toISOString(), "2026-02-16T18:00:00.000Z");
  assert.equal(parsed.createdAt.toISOString(), "2026-02-16T17:00:00.000Z");
  assert.equal(parsed.updatedAt.toISOString(), "2026-02-16T17:00:00.000Z");
});

test("shouldProcessDueJob respects nextRetryAt for failed state", () => {
  const now = new Date("2026-02-17T00:00:00.000Z");
  const dueAt = new Date("2026-02-16T23:00:00.000Z");

  assert.equal(shouldProcessDueJob("queued", dueAt, null, now), true);
  assert.equal(shouldProcessDueJob("failed", dueAt, new Date("2026-02-17T00:05:00.000Z"), now), false);
  assert.equal(shouldProcessDueJob("failed", dueAt, new Date("2026-02-16T23:59:00.000Z"), now), true);
});

test("toDateOrNull converts Timestamp-like objects", () => {
  const parsed = toDateOrNull({ toDate: () => new Date("2026-02-17T00:00:00.000Z") }, null);
  assert.equal(parsed.toISOString(), "2026-02-17T00:00:00.000Z");
});

test("resolveDueWindow returns null when dueAt is invalid", () => {
  const now = new Date("2026-02-17T00:00:00.000Z");
  const resolved = resolveDueWindow("invalid-date", null, now);
  assert.equal(resolved, null);
});
