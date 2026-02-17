import type { ChatMessage } from "../types/domain";

export type ProposalDecision = "register" | "edit" | "cancel";

const RESOLVED_STATES = new Set(["registered", "cancelled"]);

function nextState(decision: ProposalDecision): "pending" | "registered" | "cancelled" {
  if (decision === "register") {
    return "registered";
  }
  if (decision === "cancel") {
    return "cancelled";
  }
  return "pending";
}

function resultText(decision: ProposalDecision): string {
  if (decision === "register") {
    return "변경안을 등록했어요.";
  }
  if (decision === "edit") {
    return "적용 항목을 조정한 뒤 등록을 누르면 반영돼요.";
  }
  return "변경안을 취소했어요.";
}

export function applyProposalDecision(
  messages: ChatMessage[],
  targetMessageId: string,
  decision: ProposalDecision,
  nowMs = Date.now()
): ChatMessage[] {
  const target = messages.find((message) => message.id === targetMessageId);
  if (!target?.proposal) {
    return messages;
  }

  const currentState = target.proposal.state ?? "pending";
  if (RESOLVED_STATES.has(currentState)) {
    return messages;
  }

  const updated = messages.map((message) => {
    if (message.id !== targetMessageId || !message.proposal) {
      return message;
    }
    return {
      ...message,
      proposal: {
        ...message.proposal,
        state: nextState(decision)
      }
    };
  });

  return [
    ...updated,
    {
      id: `m-system-${nowMs}`,
      role: "system",
      text: resultText(decision),
      createdAtMs: nowMs,
      imageUris: []
    }
  ];
}
