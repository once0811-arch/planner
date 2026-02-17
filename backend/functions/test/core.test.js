const test = require("node:test");
const assert = require("node:assert/strict");

const { deterministicDocId } = require("../lib/lib/id.js");
const { defaultDueAtUtc } = require("../lib/jobs/runner.js");

test("deterministicDocId returns same value for same parts", () => {
  const a = deterministicDocId("uid-a", "plan", "op-1");
  const b = deterministicDocId("uid-a", "plan", "op-1");
  assert.equal(a, b);
  assert.equal(a.length, 28);
});

test("defaultDueAtUtc maps generate->03:00Z and publish->08:00Z", () => {
  const generate = defaultDueAtUtc("2026-02-17", "generate");
  const publish = defaultDueAtUtc("2026-02-17", "publish");
  assert.equal(generate.toISOString(), "2026-02-17T03:00:00.000Z");
  assert.equal(publish.toISOString(), "2026-02-17T08:00:00.000Z");
});
