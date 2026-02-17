const test = require("node:test");
const assert = require("node:assert/strict");

const { isPurgeTarget, shouldContinuePurge } = require("../lib/jobs/trashPolicy.js");

test("isPurgeTarget checks state and purgeAt cutoff", () => {
  const now = new Date("2026-02-17T00:00:00.000Z");
  assert.equal(isPurgeTarget("in_trash", new Date("2026-02-16T23:59:59.000Z"), now), true);
  assert.equal(isPurgeTarget("in_trash", new Date("2026-02-17T00:00:01.000Z"), now), false);
  assert.equal(isPurgeTarget("restored", new Date("2026-02-16T23:59:59.000Z"), now), false);
});

test("shouldContinuePurge loops only when full page is consumed", () => {
  assert.equal(shouldContinuePurge(500, 500), true);
  assert.equal(shouldContinuePurge(42, 500), false);
  assert.equal(shouldContinuePurge(0, 500), false);
});
