const test = require("node:test");
const assert = require("node:assert/strict");

const {
  buildMonthGrid,
  buildOverallStacks,
  buildIndividualStacks
} = require("../src/calendar/monthView.ts");

test("buildMonthGrid returns six-week matrix with stable local dates", () => {
  const cells = buildMonthGrid("2026-04-10");
  assert.equal(cells.length, 42);
  assert.equal(cells[0].dateLocal, "2026-03-29");
  assert.equal(cells[41].dateLocal, "2026-05-09");
});

test("buildOverallStacks paints plan range as single-color blocks", () => {
  const stacks = buildOverallStacks("2026-04-10", [
    {
      id: "plan-a",
      title: "오사카 여행",
      destination: "오사카",
      startDateLocal: "2026-04-09",
      endDateLocal: "2026-04-16",
      isForeign: true,
      updatedAtMs: 1,
      colorId: 2
    }
  ]);

  assert.equal(stacks.length, 1);
  assert.equal(stacks[0].planId, "plan-a");
  assert.equal(stacks[0].colorId, 2);
  assert.equal(stacks[0].segment, "middle");
});

test("buildOverallStacks marks start and end to render one connected block", () => {
  const plan = {
    id: "plan-a",
    title: "오사카 여행",
    destination: "오사카",
    startDateLocal: "2026-04-09",
    endDateLocal: "2026-04-16",
    isForeign: true,
    updatedAtMs: 1,
    colorId: 2
  };
  const start = buildOverallStacks("2026-04-09", [plan]);
  const end = buildOverallStacks("2026-04-16", [plan]);

  assert.equal(start[0].segment, "start");
  assert.equal(end[0].segment, "end");
});

test("buildIndividualStacks limits preview to 3 and reports +N", () => {
  const { preview, extraCount } = buildIndividualStacks("plan-a", "2026-04-10", {
    "plan-a": [
      { id: "e1", planId: "plan-a", title: "1", dateLocal: "2026-04-10", category: "todo", status: null, colorId: 0 },
      { id: "e2", planId: "plan-a", title: "2", dateLocal: "2026-04-10", category: "todo", status: null, colorId: 1 },
      { id: "e3", planId: "plan-a", title: "3", dateLocal: "2026-04-10", category: "todo", status: null, colorId: 2 },
      { id: "e4", planId: "plan-a", title: "4", dateLocal: "2026-04-10", category: "todo", status: null, colorId: 3 }
    ]
  });

  assert.equal(preview.length, 3);
  assert.equal(extraCount, 1);
});
