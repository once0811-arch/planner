const test = require("node:test");
const assert = require("node:assert/strict");

const { deterministicDocId } = require("../lib/lib/id.js");
const { defaultDueAtUtc } = require("../lib/jobs/runner.js");
const { parseGmtOffsetMinutes } = require("../lib/jobs/timePolicy.js");

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

test("defaultDueAtUtc converts local hour to UTC with timezone", () => {
  const seoulGenerate = defaultDueAtUtc("2026-02-17", "generate", "Asia/Seoul");
  const seoulPublish = defaultDueAtUtc("2026-02-17", "publish", "Asia/Seoul");
  assert.equal(seoulGenerate.toISOString(), "2026-02-16T18:00:00.000Z");
  assert.equal(seoulPublish.toISOString(), "2026-02-16T23:00:00.000Z");

  const laGenerate = defaultDueAtUtc("2026-07-01", "generate", "America/Los_Angeles");
  assert.equal(laGenerate.toISOString(), "2026-07-01T10:00:00.000Z");
});

test("parseGmtOffsetMinutes rejects unknown offset format", () => {
  assert.equal(parseGmtOffsetMinutes("GMT+9"), 540);
  assert.equal(parseGmtOffsetMinutes("GMT-08:00"), -480);
  assert.throws(
    () => parseGmtOffsetMinutes("UNKNOWN"),
    /Unsupported timezone offset format/
  );
});
