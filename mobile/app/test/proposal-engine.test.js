const test = require("node:test");
const assert = require("node:assert/strict");

const { buildChangeProposalFromInput } = require("../src/chat/proposalEngine.ts");

const BASE_PLAN = {
  id: "plan-a",
  title: "오사카 여행",
  destination: "오사카",
  startDateLocal: "2026-04-09",
  endDateLocal: "2026-04-16",
  isForeign: true,
  updatedAtMs: 1700000000000,
  colorId: 2
};

test("buildChangeProposalFromInput builds create operation from schedule-like text", () => {
  const result = buildChangeProposalFromInput({
    plan: BASE_PLAN,
    existingEvents: [],
    text: "2026-04-10 18:30 도톤보리 저녁 @도톤보리",
    imageUris: ["file:///sample.png"]
  });

  assert.equal(result.kind, "proposal");
  assert.equal(result.proposal.operationPayloads.length, 1);
  assert.equal(result.proposal.operationPayloads[0].action, "create");
  assert.equal(result.proposal.operationPayloads[0].draft.dateLocal, "2026-04-10");
  assert.equal(result.proposal.operationPayloads[0].draft.startTimeLocal, "18:30");
});

test("buildChangeProposalFromInput builds update when matching event exists", () => {
  const result = buildChangeProposalFromInput({
    plan: BASE_PLAN,
    existingEvents: [
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
    ],
    text: "2026-04-10 18:30 도톤보리 저녁 @도톤보리",
    imageUris: []
  });

  assert.equal(result.kind, "proposal");
  assert.equal(result.proposal.operationPayloads[0].action, "update");
  assert.equal(result.proposal.operationPayloads[0].targetEventId, "e-1");
});

test("buildChangeProposalFromInput asks for manual text when OCR confidence is too low", () => {
  const result = buildChangeProposalFromInput({
    plan: BASE_PLAN,
    existingEvents: [],
    text: "",
    imageUris: ["file:///sample.png"]
  });

  assert.equal(result.kind, "insufficient_data");
  assert.match(result.assistantText, /채팅으로 알려/);
});

test("buildChangeProposalFromInput treats plain conversation as chat response without proposal", () => {
  const result = buildChangeProposalFromInput({
    plan: BASE_PLAN,
    existingEvents: [],
    text: "오늘 동선이 너무 빡셀까?",
    imageUris: []
  });

  assert.equal(result.kind, "chat");
  assert.equal(result.assistantText.includes("변경안"), false);
});

test("buildChangeProposalFromInput builds OCR draft from image filename signal", () => {
  const result = buildChangeProposalFromInput({
    plan: BASE_PLAN,
    existingEvents: [],
    text: "",
    imageUris: ["file:///var/mobile/2026-04-12_1830_도톤보리저녁.png"]
  });

  assert.equal(result.kind, "proposal");
  assert.equal(result.proposal.operationPayloads[0].action, "create");
  assert.equal(result.proposal.operationPayloads[0].draft.dateLocal, "2026-04-12");
  assert.equal(result.proposal.operationPayloads[0].draft.startTimeLocal, "18:30");
});
