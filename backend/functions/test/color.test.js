const test = require("node:test");
const assert = require("node:assert/strict");

const { randomColorId } = require("../lib/lib/color.js");

test("randomColorId stays within palette bounds", () => {
  assert.equal(randomColorId(8, () => 0), 0);
  assert.equal(randomColorId(8, () => 0.875), 7);
  assert.equal(randomColorId(8, () => 0.5), 4);
});

test("randomColorId returns 0 for invalid palette size", () => {
  assert.equal(randomColorId(0, () => 0.7), 0);
});
