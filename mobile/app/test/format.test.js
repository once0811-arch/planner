const test = require("node:test");
const assert = require("node:assert/strict");

const { dateRange, formatDateFromMs } = require("../src/utils/format.ts");

test("dateRange keeps local calendar dates without timezone drift", () => {
  const result = dateRange("2026-03-01", "2026-03-03");
  assert.deepEqual(result, ["2026-03-01", "2026-03-02", "2026-03-03"]);
});

test("formatDateFromMs uses local date instead of UTC date", () => {
  const ms = new Date("2026-02-17T00:30:00+09:00").getTime();
  assert.equal(formatDateFromMs(ms), "2026.02.17");
});
