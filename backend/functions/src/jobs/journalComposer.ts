type EventStatus = "temporary" | "confirmed" | "completed" | null;
type EventCategory = "transport" | "stay" | "todo" | "shopping" | "food" | "etc" | null;

export interface JournalComposerEvent {
  id: string;
  title: string;
  status: EventStatus;
  startTimeLocal: string | null;
  category: EventCategory;
  locationLabel: string | null;
}

export interface ComposeJournalInput {
  dateLocal: string;
  planTitle: string;
  events: JournalComposerEvent[];
  photoCount: number;
  topLocationLabel: string | null;
  generateWithoutData: boolean;
}

export interface ComposeJournalOutput {
  state: "ready" | "insufficient_data";
  summary: string;
  entryText: string;
}

function statusScore(status: EventStatus) {
  if (status === "completed") {
    return 3;
  }
  if (status === "confirmed") {
    return 2;
  }
  if (status === null) {
    return 1;
  }
  return 0;
}

function rankEvents(events: JournalComposerEvent[]) {
  return events
    .filter((event) => event.status !== "temporary")
    .sort((a, b) => {
      const scoreGap = statusScore(b.status) - statusScore(a.status);
      if (scoreGap !== 0) {
        return scoreGap;
      }
      const timeA = a.startTimeLocal ?? "99:99";
      const timeB = b.startTimeLocal ?? "99:99";
      const timeGap = timeA.localeCompare(timeB);
      if (timeGap !== 0) {
        return timeGap;
      }
      return a.id.localeCompare(b.id);
    })
    .slice(0, 5);
}

function photoText(photoCount: number) {
  if (photoCount <= 0) {
    return "사진은 연결되지 않았어요.";
  }
  return `사진 ${photoCount}장을 함께 묶었어요.`;
}

export function composeJournalDay(input: ComposeJournalInput): ComposeJournalOutput {
  const ranked = rankEvents(input.events);
  if (ranked.length === 0 && !input.generateWithoutData) {
    return {
      state: "insufficient_data",
      summary: "정보가 부족해 일지를 만들지 못 했어요",
      entryText: "정보가 부족해 일지를 만들지 못 했어요"
    };
  }

  if (ranked.length === 0) {
    return {
      state: "ready",
      summary: "일정 계획 기반으로 일지를 만들었어요.",
      entryText: `${input.planTitle}의 ${input.dateLocal} 계획을 기준으로 일지를 생성했어요. ${photoText(input.photoCount)}`
    };
  }

  const leadTitles = ranked.slice(0, 3).map((event) => event.title).join(", ");
  const locationText = input.topLocationLabel
    ? `주요 동선은 ${input.topLocationLabel} 중심으로 정리됐어요.`
    : "";

  return {
    state: "ready",
    summary: `핵심 일정 ${ranked.length}개를 반영해 일지를 만들었어요.`,
    entryText: `${input.dateLocal}에는 ${leadTitles} 중심으로 움직였어요. ${locationText} ${photoText(input.photoCount)}`.trim()
  };
}
