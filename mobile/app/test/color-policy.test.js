const test = require("node:test");
const assert = require("node:assert/strict");

const { randomPaletteIndex } = require("../src/theme/colorPolicy.ts");

test("randomPaletteIndex maps rng output into palette range", () => {
  assert.equal(randomPaletteIndex(8, () => 0), 0);
  assert.equal(randomPaletteIndex(8, () => 0.24), 1);
  assert.equal(randomPaletteIndex(8, () => 0.9999), 7);
});

test("randomPaletteIndex handles invalid palette size safely", () => {
  assert.equal(randomPaletteIndex(0, () => 0.5), 0);
});
