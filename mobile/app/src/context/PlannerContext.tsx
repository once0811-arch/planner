import { createContext, useContext, useEffect, useMemo, useState } from "react";
import {
  seedDayMemos,
  seedEvents,
  seedJournals,
  seedMessages,
  seedPlans,
  seedSettings,
  seedTrash
} from "../data/mock";
import type {
  ChatMessage,
  JournalEntry,
  JournalEntryType,
  TrashItem,
  TravelPlan,
  TripEvent,
  UserSettings,
  DayMemo
} from "../types/domain";
import {
  createSignedOutSession,
  signInWithProvider,
  signOut,
  type AuthProvider,
  type AuthSession
} from "../auth/session";
import {
  applyProposalDecision as applyProposalDecisionToMessages,
  type ProposalDecision
} from "../chat/proposalActions";
import { buildChangeProposalFromInput } from "../chat/proposalEngine";
import { applyProposalOperations } from "../chat/proposalApply";
import {
  applyJournalTextUpdate as applyJournalTextUpdateFromState
} from "../journal/journalActions";
import { moveJournalToTrash, restoreEntityFromTrash } from "../journal/trashFlow";
import { rebuildAutoJournals } from "../journal/autoJournal";
import { composeJournalDraft } from "../journal/generator";
import { randomPaletteIndex } from "../theme/colorPolicy";

type JournalViewMode = "plan" | "type";
type CreatePlanInput = {
  title: string;
  destination: string;
  startDateLocal: string;
  endDateLocal: string;
  isForeign: boolean;
};

interface PlannerContextValue {
  authSession: AuthSession;
  signIn: (provider: AuthProvider) => void;
  signOutSession: () => void;
  plans: TravelPlan[];
  sortedPlans: TravelPlan[];
  activePlanId: string | null;
  setActivePlanId: (planId: string | null) => void;
  createPlanQuick: (input?: Partial<CreatePlanInput>) => string;
  messagesByPlan: Record<string, ChatMessage[]>;
  appendMessage: (planId: string, text: string, imageUris?: string[]) => void;
  decideProposal: (planId: string, messageId: string, decision: ProposalDecision) => void;
  setProposalOperationEnabled: (planId: string, messageId: string, opIndex: number, enabled: boolean) => void;
  eventsByPlan: Record<string, TripEvent[]>;
  dayMemosByPlan: Record<string, DayMemo[]>;
  journals: JournalEntry[];
  addManualJournal: (planId: string, dateLocal: string) => void;
  updateJournalText: (journalId: string, text: string) => void;
  updateJournalImage: (journalId: string, imageUri: string | null) => void;
  deleteJournal: (journalId: string) => void;
  journalViewMode: JournalViewMode;
  setJournalViewMode: (mode: JournalViewMode) => void;
  selectedJournalPlanId: string | null;
  setSelectedJournalPlanId: (planId: string | null) => void;
  selectedJournalType: JournalEntryType | "all";
  setSelectedJournalType: (type: JournalEntryType | "all") => void;
  toggleJournalPlanEnabled: (planId: string) => void;
  settings: UserSettings;
  toggleJournalGenerateWithoutData: () => void;
  setGalleryPermissionState: (state: UserSettings["galleryPermissionState"]) => void;
  trashItems: TrashItem[];
  restoreTrashItem: (trashId: string) => void;
}

const PlannerContext = createContext<PlannerContextValue | null>(null);

function nextColorId() {
  return randomPaletteIndex(8);
}

function currentDateLocal(nowMs = Date.now()) {
  const date = new Date(nowMs);
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(
    date.getDate()
  ).padStart(2, "0")}`;
}

export function PlannerProvider({ children }: { children: React.ReactNode }) {
  const [authSession, setAuthSession] = useState<AuthSession>(createSignedOutSession());
  const [plans, setPlans] = useState<TravelPlan[]>(seedPlans);
  const [activePlanId, setActivePlanId] = useState<string | null>(null);
  const [messagesByPlan, setMessagesByPlan] = useState<Record<string, ChatMessage[]>>(seedMessages);
  const [eventsByPlan, setEventsByPlan] = useState<Record<string, TripEvent[]>>(seedEvents);
  const [dayMemosByPlan, setDayMemosByPlan] = useState<Record<string, DayMemo[]>>(seedDayMemos);
  const [journals, setJournals] = useState<JournalEntry[]>(seedJournals);
  const [trashItems, setTrashItems] = useState<TrashItem[]>(seedTrash);
  const [settings, setSettings] = useState<UserSettings>(seedSettings);
  const [journalViewMode, setJournalViewMode] = useState<JournalViewMode>("plan");
  const [selectedJournalPlanId, setSelectedJournalPlanId] = useState<string | null>(seedPlans[0]?.id ?? null);
  const [selectedJournalType, setSelectedJournalType] = useState<JournalEntryType | "all">("all");

  const sortedPlans = useMemo(
    () => [...plans].sort((a, b) => b.updatedAtMs - a.updatedAtMs),
    [plans]
  );

  useEffect(() => {
    setJournals((current) =>
      rebuildAutoJournals(
        plans,
        eventsByPlan,
        current,
        settings.journalGenerateWithoutData,
        composeJournalDraft
      )
    );
  }, [plans, eventsByPlan, settings.journalGenerateWithoutData]);

  const appendMessage = (planId: string, text: string, imageUris: string[] = []) => {
    const safeText = text.trim();
    const attachedImages = imageUris.map((uri) => uri.trim()).filter(Boolean);
    if (!safeText && attachedImages.length === 0) {
      return;
    }

    const targetPlan = plans.find((plan) => plan.id === planId);
    if (!targetPlan) {
      return;
    }

    const result = buildChangeProposalFromInput({
      plan: targetPlan,
      existingEvents: eventsByPlan[planId] ?? [],
      text: safeText,
      imageUris: attachedImages
    });
    const nowMs = Date.now();

    setMessagesByPlan((current) => {
      const prev = current[planId] ?? [];
      const userMessage: ChatMessage = {
        id: `m-user-${nowMs}`,
        role: "user",
        text: safeText || `이미지 ${attachedImages.length}장 첨부`,
        createdAtMs: nowMs,
        imageUris: attachedImages
      };
      const assistantEcho: ChatMessage = {
        id: `m-assistant-${nowMs}`,
        role: "assistant",
        text: result.assistantText,
        createdAtMs: nowMs + 1,
        imageUris: [],
        proposal:
          result.kind === "proposal"
            ? {
                ...result.proposal,
                operationPayloads: result.proposal.operationPayloads.map((payload) => ({
                  ...payload,
                  enabled: payload.enabled ?? true
                }))
              }
            : undefined
      };
      return {
        ...current,
        [planId]: [...prev, userMessage, assistantEcho]
      };
    });

    setPlans((current) =>
      current.map((plan) =>
        plan.id === planId
          ? {
              ...plan,
              updatedAtMs: Date.now()
            }
          : plan
      )
    );
  };

  const decideProposal = (planId: string, messageId: string, decision: ProposalDecision) => {
    const targetMessage = (messagesByPlan[planId] ?? []).find((message) => message.id === messageId);
    const operationPayloads = (targetMessage?.proposal?.operationPayloads ?? []).filter(
      (payload) => payload.enabled !== false
    );

    setMessagesByPlan((current) => {
      const prev = current[planId] ?? [];
      const next = applyProposalDecisionToMessages(prev, messageId, decision);
      if (next === prev) {
        return current;
      }
      return {
        ...current,
        [planId]: next
      };
    });

    if (decision === "register" && operationPayloads.length > 0) {
      setEventsByPlan((current) => ({
        ...current,
        [planId]: applyProposalOperations(planId, current[planId] ?? [], operationPayloads, {
          colorId: nextColorId()
        })
      }));
    }

    setPlans((current) =>
      current.map((plan) =>
        plan.id === planId
          ? {
              ...plan,
              updatedAtMs: Date.now()
            }
          : plan
      )
    );
  };

  const setProposalOperationEnabled = (planId: string, messageId: string, opIndex: number, enabled: boolean) => {
    setMessagesByPlan((current) => {
      const prev = current[planId] ?? [];
      let changed = false;
      const next = prev.map((message) => {
        if (message.id !== messageId || !message.proposal) {
          return message;
        }
        if (!message.proposal.operationPayloads[opIndex]) {
          return message;
        }
        const payloads = message.proposal.operationPayloads.map((payload, index) =>
          index === opIndex ? { ...payload, enabled } : payload
        );
        changed = true;
        return {
          ...message,
          proposal: {
            ...message.proposal,
            operationPayloads: payloads
          }
        };
      });
      if (!changed) {
        return current;
      }
      return {
        ...current,
        [planId]: next
      };
    });
  };

  const createPlanQuick = (input: Partial<CreatePlanInput> = {}) => {
    const createdAtMs = Date.now();
    const planId = `plan-${createdAtMs}`;
    const startDateLocal = input.startDateLocal ?? currentDateLocal(createdAtMs);
    const endDateLocal = input.endDateLocal ?? startDateLocal;
    const normalizedEnd = endDateLocal < startDateLocal ? startDateLocal : endDateLocal;
    const newPlan: TravelPlan = {
      id: planId,
      title: input.title?.trim() || "새 여행 플랜",
      destination: input.destination?.trim() || "목적지 미정",
      startDateLocal,
      endDateLocal: normalizedEnd,
      isForeign: input.isForeign ?? false,
      journalEnabledAtMs: null,
      updatedAtMs: createdAtMs,
      colorId: nextColorId()
    };

    setPlans((current) => [newPlan, ...current]);
    setMessagesByPlan((current) => ({
      ...current,
      [planId]: []
    }));
    setEventsByPlan((current) => ({
      ...current,
      [planId]: []
    }));

    return planId;
  };

  const toggleJournalGenerateWithoutData = () => {
    setSettings((current) => ({
      ...current,
      journalGenerateWithoutData: !current.journalGenerateWithoutData
    }));
  };

  const toggleJournalPlanEnabled = (planId: string) => {
    setPlans((current) =>
      current.map((plan) =>
        plan.id === planId
          ? {
              ...plan,
              journalEnabledAtMs: plan.journalEnabledAtMs === null ? Date.now() : null,
              updatedAtMs: Date.now()
            }
          : plan
      )
    );
  };

  const setGalleryPermissionState = (state: UserSettings["galleryPermissionState"]) => {
    setSettings((current) => ({
      ...current,
      galleryPermissionState: state
    }));
  };

  const restoreTrashItem = (trashId: string) => {
    const restored = restoreEntityFromTrash(
      {
        journals,
        eventsByPlan,
        dayMemosByPlan,
        plans
      },
      trashItems,
      trashId
    );

    setJournals(restored.journals);
    setEventsByPlan(restored.eventsByPlan);
    setDayMemosByPlan(restored.dayMemosByPlan);
    setPlans(restored.plans);
    setTrashItems(restored.trashItems);
  };

  const updateJournalText = (journalId: string, text: string) => {
    setJournals((current) => applyJournalTextUpdateFromState(current, journalId, text));
  };

  const addManualJournal = (planId: string, dateLocal: string) => {
    const text = "새 수동 일지";
    setJournals((current) => [
      {
        id: `jr-manual-${planId}-${Date.now()}`,
        planId,
        dateLocal,
        type: "etc",
        text,
        imageUri: null,
        autoGenerated: false
      },
      ...current
    ]);
  };

  const updateJournalImage = (journalId: string, imageUri: string | null) => {
    setJournals((current) =>
      current.map((journal) =>
        journal.id === journalId
          ? {
              ...journal,
              imageUri
            }
          : journal
      )
    );
  };

  const deleteJournal = (journalId: string) => {
    const nextState = moveJournalToTrash(journals, trashItems, journalId);
    setJournals(nextState.journals);
    setTrashItems(nextState.trashItems);
  };

  const signIn = (provider: AuthProvider) => {
    setAuthSession((current) => signInWithProvider(current, provider));
  };

  const signOutSession = () => {
    setAuthSession((current) => signOut(current));
    setActivePlanId(null);
  };

  const value = {
    authSession,
    signIn,
    signOutSession,
    plans,
    sortedPlans,
    activePlanId,
    setActivePlanId,
    createPlanQuick,
    messagesByPlan,
    appendMessage,
    decideProposal,
    setProposalOperationEnabled,
    eventsByPlan,
    dayMemosByPlan,
    journals,
    addManualJournal,
    updateJournalText,
    updateJournalImage,
    deleteJournal,
    journalViewMode,
    setJournalViewMode,
    selectedJournalPlanId,
    setSelectedJournalPlanId,
    selectedJournalType,
    setSelectedJournalType,
    toggleJournalPlanEnabled,
    settings,
    toggleJournalGenerateWithoutData,
    setGalleryPermissionState,
    trashItems,
    restoreTrashItem
  } satisfies PlannerContextValue;

  return <PlannerContext.Provider value={value}>{children}</PlannerContext.Provider>;
}

export function usePlanner() {
  const context = useContext(PlannerContext);
  if (!context) {
    throw new Error("usePlanner must be used inside PlannerProvider.");
  }
  return context;
}
