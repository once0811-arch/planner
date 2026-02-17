import { createContext, useContext, useMemo, useState } from "react";
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

type JournalViewMode = "plan" | "type";

interface PlannerContextValue {
  plans: TravelPlan[];
  sortedPlans: TravelPlan[];
  activePlanId: string | null;
  setActivePlanId: (planId: string | null) => void;
  createPlanQuick: () => string;
  messagesByPlan: Record<string, ChatMessage[]>;
  appendMessage: (planId: string, text: string) => void;
  eventsByPlan: Record<string, TripEvent[]>;
  dayMemosByPlan: Record<string, DayMemo[]>;
  journals: JournalEntry[];
  journalViewMode: JournalViewMode;
  setJournalViewMode: (mode: JournalViewMode) => void;
  selectedJournalPlanId: string | null;
  setSelectedJournalPlanId: (planId: string | null) => void;
  selectedJournalType: JournalEntryType | "all";
  setSelectedJournalType: (type: JournalEntryType | "all") => void;
  settings: UserSettings;
  toggleJournalGenerateWithoutData: () => void;
  setGalleryPermissionState: (state: UserSettings["galleryPermissionState"]) => void;
  trashItems: TrashItem[];
  restoreTrashItem: (trashId: string) => void;
}

const PlannerContext = createContext<PlannerContextValue | null>(null);

function nextColorId(planCount: number) {
  return planCount % 8;
}

export function PlannerProvider({ children }: { children: React.ReactNode }) {
  const [plans, setPlans] = useState<TravelPlan[]>(seedPlans);
  const [activePlanId, setActivePlanId] = useState<string | null>(null);
  const [messagesByPlan, setMessagesByPlan] = useState<Record<string, ChatMessage[]>>(seedMessages);
  const [eventsByPlan] = useState<Record<string, TripEvent[]>>(seedEvents);
  const [dayMemosByPlan] = useState<Record<string, DayMemo[]>>(seedDayMemos);
  const [journals] = useState<JournalEntry[]>(seedJournals);
  const [trashItems, setTrashItems] = useState<TrashItem[]>(seedTrash);
  const [settings, setSettings] = useState<UserSettings>(seedSettings);
  const [journalViewMode, setJournalViewMode] = useState<JournalViewMode>("plan");
  const [selectedJournalPlanId, setSelectedJournalPlanId] = useState<string | null>(seedPlans[0]?.id ?? null);
  const [selectedJournalType, setSelectedJournalType] = useState<JournalEntryType | "all">("all");

  const sortedPlans = useMemo(
    () => [...plans].sort((a, b) => b.updatedAtMs - a.updatedAtMs),
    [plans]
  );

  const appendMessage = (planId: string, text: string) => {
    const safeText = text.trim();
    if (!safeText) {
      return;
    }

    setMessagesByPlan((current) => {
      const prev = current[planId] ?? [];
      const userMessage: ChatMessage = {
        id: `m-user-${Date.now()}`,
        role: "user",
        text: safeText,
        createdAtMs: Date.now(),
        imageUris: []
      };
      const assistantEcho: ChatMessage = {
        id: `m-assistant-${Date.now()}`,
        role: "assistant",
        text: "제안 변경안을 만들었어요. 등록 버튼을 누르면 반영됩니다.",
        createdAtMs: Date.now() + 1,
        imageUris: [],
        proposal: {
          summary: "변경안 1건",
          operations: ["수정 1건", "등록 0건", "취소 0건"]
        }
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

  const createPlanQuick = () => {
    const createdAtMs = Date.now();
    const planId = `plan-${createdAtMs}`;
    const newPlan: TravelPlan = {
      id: planId,
      title: "새 여행 플랜",
      destination: "목적지 미정",
      startDateLocal: "2026-06-01",
      endDateLocal: "2026-06-03",
      isForeign: false,
      updatedAtMs: createdAtMs,
      colorId: nextColorId(plans.length)
    };

    setPlans((current) => [newPlan, ...current]);
    setMessagesByPlan((current) => ({
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

  const setGalleryPermissionState = (state: UserSettings["galleryPermissionState"]) => {
    setSettings((current) => ({
      ...current,
      galleryPermissionState: state
    }));
  };

  const restoreTrashItem = (trashId: string) => {
    setTrashItems((current) => current.filter((item) => item.id !== trashId));
  };

  const value = {
    plans,
    sortedPlans,
    activePlanId,
    setActivePlanId,
    createPlanQuick,
    messagesByPlan,
    appendMessage,
    eventsByPlan,
    dayMemosByPlan,
    journals,
    journalViewMode,
    setJournalViewMode,
    selectedJournalPlanId,
    setSelectedJournalPlanId,
    selectedJournalType,
    setSelectedJournalType,
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
