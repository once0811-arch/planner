import type {
  ChangeProposalPreview,
  ProposalOperationPayload,
  TravelPlan,
  TripEvent
} from "../types/domain";

const DATE_PATTERN = /(20\d{2})[./-](\d{1,2})[./-](\d{1,2})/;
const TIME_PATTERN = /(?:^|\s)([01]?\d|2[0-3])(?::([0-5]\d)|시([0-5]\d)?분?)/;
const LOCATION_PATTERN = /@([^@\n]+)/;

interface DraftCandidate {
  title: string;
  dateLocal: string;
  startTimeLocal?: string;
  locationLabel?: string;
  confidence: number;
}

interface BuildInput {
  plan: TravelPlan;
  existingEvents: TripEvent[];
  text: string;
  imageUris: string[];
}

type BuildResult =
  | {
      kind: "proposal";
      assistantText: string;
      proposal: ChangeProposalPreview;
    }
  | {
      kind: "chat";
      assistantText: string;
    }
  | {
      kind: "insufficient_data";
      assistantText: string;
    };

function pad2(value: number) {
  return String(value).padStart(2, "0");
}

function normalizeDate(year: number, month: number, day: number) {
  return `${year}-${pad2(month)}-${pad2(day)}`;
}

function normalizeTitle(title: string) {
  return title.trim().replace(/\s+/g, " ").toLowerCase();
}

function buildConfidence(parts: { title: boolean; date: boolean; time: boolean; location: boolean }) {
  let score = 0;
  if (parts.title) {
    score += 0.35;
  }
  if (parts.date) {
    score += 0.35;
  }
  if (parts.time) {
    score += 0.2;
  }
  if (parts.location) {
    score += 0.1;
  }
  return Math.min(score, 1);
}

function normalizeImageLabel(imageUri: string) {
  const last = imageUri.split("/").pop() ?? imageUri;
  try {
    return decodeURIComponent(last);
  } catch (_error) {
    return last;
  }
}

function parseImageUriToCandidate(imageUri: string, fallbackDateLocal: string): DraftCandidate | null {
  const label = normalizeImageLabel(imageUri).replace(/\.[^.]+$/, "");
  if (!label.trim()) {
    return null;
  }
  const normalized = label
    .replace(/[_]/g, " ")
    .replace(/(^|[^0-9./-])([01]?\d|2[0-3])([0-5]\d)(?=$|[^0-9./-])/g, "$1$2:$3");
  return parseLineToCandidate(normalized, fallbackDateLocal);
}

function isScheduleIntent(text: string): boolean {
  if (DATE_PATTERN.test(text) || TIME_PATTERN.test(text)) {
    return true;
  }
  return /(일정|등록|추가|수정|취소|삭제|변경|옮겨|이동)/.test(text);
}

function parseLineToCandidate(line: string, fallbackDateLocal: string): DraftCandidate | null {
  const text = line.trim();
  if (!text) {
    return null;
  }

  const dateMatch = text.match(DATE_PATTERN);
  const timeMatch = text.match(TIME_PATTERN);
  const locationMatch = text.match(LOCATION_PATTERN);

  const dateLocal = dateMatch
    ? normalizeDate(Number(dateMatch[1]), Number(dateMatch[2]), Number(dateMatch[3]))
    : fallbackDateLocal;

  const startTimeLocal = timeMatch
    ? `${pad2(Number(timeMatch[1]))}:${timeMatch[2] ? pad2(Number(timeMatch[2])) : pad2(Number(timeMatch[3] ?? 0))}`
    : undefined;

  const locationLabel = locationMatch?.[1]?.trim();

  const title = text
    .replace(DATE_PATTERN, "")
    .replace(TIME_PATTERN, "")
    .replace(LOCATION_PATTERN, "")
    .replace(/[-|,]/g, " ")
    .trim();

  const hasTitle = title.length > 0;
  const confidence = buildConfidence({
    title: hasTitle,
    date: Boolean(dateMatch),
    time: Boolean(startTimeLocal),
    location: Boolean(locationLabel)
  });

  if (!hasTitle) {
    return null;
  }

  return {
    title,
    dateLocal,
    startTimeLocal,
    locationLabel,
    confidence
  };
}

function matchExistingEvent(candidate: DraftCandidate, events: TripEvent[]): TripEvent | null {
  const targetTitle = normalizeTitle(candidate.title);
  for (const event of events) {
    if (event.dateLocal !== candidate.dateLocal) {
      continue;
    }
    const existing = normalizeTitle(event.title);
    if (existing.includes(targetTitle) || targetTitle.includes(existing)) {
      return event;
    }
  }
  return null;
}

function buildOperation(candidate: DraftCandidate, existingEvents: TripEvent[]): ProposalOperationPayload {
  const matched = matchExistingEvent(candidate, existingEvents);
  const draft: Partial<TripEvent> = {
    title: candidate.title,
    dateLocal: candidate.dateLocal,
    startTimeLocal: candidate.startTimeLocal,
    locationLabel: candidate.locationLabel,
    status: "confirmed"
  };

  if (!matched) {
    return {
      action: "create",
      draft
    };
  }

  return {
    action: "update",
    targetEventId: matched.id,
    draft
  };
}

function summarizeOperations(payloads: ProposalOperationPayload[]) {
  let createCount = 0;
  let updateCount = 0;
  let deleteCount = 0;

  for (const op of payloads) {
    if (op.action === "create") {
      createCount += 1;
      continue;
    }
    if (op.action === "update") {
      updateCount += 1;
      continue;
    }
    deleteCount += 1;
  }

  return [`등록 ${createCount}건`, `수정 ${updateCount}건`, `취소 ${deleteCount}건`];
}

export function buildChangeProposalFromInput(input: BuildInput): BuildResult {
  const text = input.text.trim();
  const lines = text
    .split(/\n+/)
    .map((line) => line.trim())
    .filter(Boolean);

  const candidates: DraftCandidate[] = [];
  for (const line of lines) {
    const parsed = parseLineToCandidate(line, input.plan.startDateLocal);
    if (!parsed) {
      continue;
    }
    if (parsed.confidence < 0.5) {
      continue;
    }
    candidates.push(parsed);
  }

  for (const uri of input.imageUris) {
    const parsed = parseImageUriToCandidate(uri, input.plan.startDateLocal);
    if (!parsed) {
      continue;
    }
    if (parsed.confidence < 0.5) {
      continue;
    }
    candidates.push(parsed);
  }

  if (candidates.length === 0 && text && isScheduleIntent(text)) {
    candidates.push({
      title: text,
      dateLocal: input.plan.startDateLocal,
      confidence: 0.55
    });
  }

  if (candidates.length === 0 && text && !input.imageUris.length) {
    return {
      kind: "chat",
      assistantText: "좋아요. 이 메시지는 일정 변경 없이 참고 메모로 이해했어요. 필요하면 날짜/시간을 함께 알려주세요."
    };
  }

  if (candidates.length === 0) {
    if (input.imageUris.length > 0) {
      return {
        kind: "insufficient_data",
        assistantText: "이미지 인식이 어려워서 초안을 만들지 못 했어요. 채팅으로 알려주면 바로 반영할게요."
      };
    }
    return {
      kind: "insufficient_data",
      assistantText: "일정 정보를 더 알려주면 변경안을 만들 수 있어요."
    };
  }

  const operationPayloads = candidates.map((candidate) => buildOperation(candidate, input.existingEvents));
  const confidence =
    candidates.reduce((sum, candidate) => sum + candidate.confidence, 0) / Math.max(candidates.length, 1);
  const operations = summarizeOperations(operationPayloads);

  return {
    kind: "proposal",
    assistantText: "대화와 첨부 정보를 바탕으로 변경안을 만들었어요. 승인하면 일정에 반영됩니다.",
    proposal: {
      summary: `변경안 ${operationPayloads.length}건`,
      operations,
      operationPayloads,
      source: input.imageUris.length > 0 ? "ocr" : "chat",
      confidence,
      state: "pending"
    }
  };
}
