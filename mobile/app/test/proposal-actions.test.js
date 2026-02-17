const test = require("node:test");
const assert = require("node:assert/strict");

const { applyProposalDecision } = require("../src/chat/proposalActions.ts");

test("register action resolves proposal and appends system message", () => {
  const nowMs = 1700000000000;
  const messages = [
    {
      id: "m1",
      role: "assistant",
      text: "변경안입니다.",
      createdAtMs: nowMs,
      imageUris: [],
      proposal: {
        summary: "변경안 1건",
        operations: ["수정 1건"],
        state: "pending"
      }
    }
  ];

  const next = applyProposalDecision(messages, "m1", "register", nowMs + 1000);
  assert.equal(next.length, 2);
  assert.equal(next[0].proposal.state, "registered");
  assert.equal(next[1].role, "system");
  assert.equal(next[1].text, "변경안을 등록했어요.");
});

test("resolved proposal ignores duplicate decisions", () => {
  const nowMs = 1700000000000;
  const messages = [
    {
      id: "m1",
      role: "assistant",
      text: "변경안입니다.",
      createdAtMs: nowMs,
      imageUris: [],
      proposal: {
        summary: "변경안 1건",
        operations: ["수정 1건"],
        state: "registered"
      }
    }
  ];

  const next = applyProposalDecision(messages, "m1", "cancel", nowMs + 1000);
  assert.equal(next.length, 1);
  assert.equal(next[0].proposal.state, "registered");
});

test("edit action keeps proposal pending for override workflow", () => {
  const nowMs = 1700000000000;
  const messages = [
    {
      id: "m1",
      role: "assistant",
      text: "변경안입니다.",
      createdAtMs: nowMs,
      imageUris: [],
      proposal: {
        summary: "변경안 1건",
        operations: ["수정 1건"],
        operationPayloads: [],
        state: "pending"
      }
    }
  ];

  const next = applyProposalDecision(messages, "m1", "edit", nowMs + 1000);
  assert.equal(next[0].proposal.state, "pending");
  assert.equal(next[1].role, "system");
  assert.match(next[1].text, /적용 항목/);
});
