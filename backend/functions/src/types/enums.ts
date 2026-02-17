export const EVENT_STATUS = ["temporary", "confirmed", "completed", null] as const;
export const EVENT_CATEGORY = ["transport", "stay", "todo", "shopping", "food", "etc", null] as const;
export const PROPOSAL_TYPE = ["create", "update", "delete"] as const;
export const PROPOSAL_APPROVAL_STATE = ["pending", "approved", "rejected", "expired"] as const;
export const JOURNAL_JOB_PHASE = ["generate", "publish", "backfill"] as const;
export const JOURNAL_JOB_STATE = ["queued", "running", "done", "failed", "deadletter"] as const;
export const MESSAGE_ROLE = ["user", "assistant", "system"] as const;
