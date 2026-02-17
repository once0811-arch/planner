const test = require("node:test");
const assert = require("node:assert/strict");

const { resolveCreatePlanOpId } = require("../lib/api/createPlan.js");

test("resolveCreatePlanOpId keeps explicit opId", () => {
  assert.equal(resolveCreatePlanOpId(" custom-op-id "), "custom-op-id");
});

test("resolveCreatePlanOpId generates unique opId when omitted", () => {
  const first = resolveCreatePlanOpId(undefined);
  const second = resolveCreatePlanOpId(undefined);

  assert.notEqual(first, second);
  assert.equal(typeof first, "string");
  assert.equal(typeof second, "string");
  assert.ok(first.length > 0);
  assert.ok(second.length > 0);
});
