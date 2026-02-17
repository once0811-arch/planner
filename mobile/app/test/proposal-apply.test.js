const test = require("node:test");
const assert = require("node:assert/strict");

const { applyProposalOperations } = require("../src/chat/proposalApply.ts");

test("applyProposalOperations creates new event with confirmed default", () => {
  const events = [];
  const next = applyProposalOperations("plan-a", events, [
    {
      action: "create",
      draft: {
        title: "도톤보리 저녁",
        dateLocal: "2026-04-10",
        startTimeLocal: "18:30"
      }
    }
  ], {
    nowMs: 1700000000000,
    colorId: 3
  });

  assert.equal(next.length, 1);
  assert.equal(next[0].status, "confirmed");
  assert.equal(next[0].colorId, 3);
});

test("applyProposalOperations updates matching event when update action is provided", () => {
  const events = [
    {
      id: "e-1",
      planId: "plan-a",
      title: "도톤보리 저녁",
      dateLocal: "2026-04-10",
      startTimeLocal: "17:30",
      category: "food",
      status: "confirmed",
      colorId: 1
    }
  ];

  const next = applyProposalOperations("plan-a", events, [
    {
      action: "update",
      targetEventId: "e-1",
      draft: {
        startTimeLocal: "18:30"
      }
    }
  ]);

  assert.equal(next[0].startTimeLocal, "18:30");
});
