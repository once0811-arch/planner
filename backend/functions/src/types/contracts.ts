export type Actor = "user" | "system";

export interface OutboxEnvelope<TPayload> {
  opId: string;
  opType: string;
  payload: TPayload;
  createdAtMs: number;
}

export interface CreatePlanPayload {
  opId?: string;
  title: string;
  destination: string;
  startDateLocal: string;
  endDateLocal: string;
  planTimezone: string;
  isForeign?: boolean;
}

export interface AppendMessagePayload {
  opId?: string;
  planId: string;
  role: "user" | "assistant" | "system";
  text?: string;
  imagePaths?: string[];
  linkedProposalId?: string;
}

export type ProposalOpType = "create" | "update" | "delete";
export type ProposalTargetType = "plan" | "event" | "dayMemo";

export interface ChangeOperation {
  op: ProposalOpType;
  targetType: ProposalTargetType;
  targetId?: string | null;
  patch?: Record<string, unknown>;
  draftData?: Record<string, unknown>;
  overrideAllowed?: boolean;
}

export interface RequestChangeProposalPayload {
  opId?: string;
  planId: string;
  proposalType: ProposalOpType;
  bundleId?: string | null;
  operations: ChangeOperation[];
}

export interface ApproveChangePayload {
  opId?: string;
  planId: string;
  proposalId: string;
}

export type TrashEntityType = "plan" | "event" | "dayMemo" | "journalDay" | "journalEntry";

export interface DeleteToTrashPayload {
  opId?: string;
  planId: string;
  entityType: TrashEntityType;
  entityId?: string;
}

export interface RestoreFromTrashPayload {
  opId?: string;
  trashId: string;
}

export type JournalJobPhase = "generate" | "publish" | "backfill";

export interface EnqueueJournalJobPayload {
  opId?: string;
  planId: string;
  dateLocal: string;
  phase: JournalJobPhase;
  timezone?: string;
  dueAtUtcMs?: number;
}

export interface RunJournalJobPayload {
  opId?: string;
  jobId: string;
}
