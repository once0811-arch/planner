import type { TripEvent } from "../types/domain";

interface ComposeInput {
  dateLocal: string;
  planTitle: string;
  events: TripEvent[];
  photoCount: number;
  topLocationLabel: string | null;
  generateWithoutData?: boolean;
}

interface ComposeOutput {
  state: "ready" | "insufficient_data";
  text: string;
}

function statusScore(status: TripEvent["status"]) {
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

function rankEvents(events: TripEvent[]) {
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

function buildLocationText(topLocationLabel: string | null) {
  if (!topLocationLabel) {
    return "";
  }
  return `주요 동선은 ${topLocationLabel} 중심으로 정리됐어요.`;
}

function buildPhotoText(photoCount: number) {
  if (photoCount <= 0) {
    return "사진은 연결되지 않았어요.";
  }
  return `사진 ${photoCount}장을 함께 묶었어요.`;
}

export function composeJournalDraft(input: ComposeInput): ComposeOutput {
  const coreEvents = rankEvents(input.events);
  if (coreEvents.length === 0 && input.generateWithoutData === false) {
    return {
      state: "insufficient_data",
      text: "정보가 부족해 일지를 만들지 못 했어요"
    };
  }

  if (coreEvents.length === 0) {
    const fallback = `${input.planTitle} 일정 계획을 기준으로 ${input.dateLocal} 일지를 생성했어요.`;
    return {
      state: "ready",
      text: `${fallback} ${buildPhotoText(input.photoCount)}`
    };
  }

  const leadEvents = coreEvents.slice(0, 3).map((event) => event.title).join(", ");
  const locationText = buildLocationText(input.topLocationLabel);
  const photoText = buildPhotoText(input.photoCount);

  return {
    state: "ready",
    text: `${input.dateLocal}에는 ${leadEvents} 중심으로 움직였어요. ${locationText} ${photoText}`.trim()
  };
}
