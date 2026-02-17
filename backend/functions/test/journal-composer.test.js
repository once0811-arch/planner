const test = require("node:test");
const assert = require("node:assert/strict");

const { composeJournalDay } = require("../lib/jobs/journalComposer.js");

test("composeJournalDay summarizes top events with photo and location hints", () => {
  const result = composeJournalDay({
    dateLocal: "2026-04-10",
    planTitle: "오사카 여행",
    events: [
      { id: "e1", title: "난바 체크인", status: "confirmed", startTimeLocal: "15:00", category: "stay", locationLabel: "난바" },
      { id: "e2", title: "도톤보리 저녁", status: "completed", startTimeLocal: "19:00", category: "food", locationLabel: "도톤보리" }
    ],
    photoCount: 6,
    topLocationLabel: "난바",
    generateWithoutData: true
  });

  assert.equal(result.state, "ready");
  assert.match(result.summary, /핵심 일정 2개/);
  assert.match(result.entryText, /사진 6장/);
});

test("composeJournalDay returns insufficient_data when no signals and generation is disabled", () => {
  const result = composeJournalDay({
    dateLocal: "2026-04-10",
    planTitle: "오사카 여행",
    events: [],
    photoCount: 0,
    topLocationLabel: null,
    generateWithoutData: false
  });

  assert.equal(result.state, "insufficient_data");
  assert.equal(result.entryText, "정보가 부족해 일지를 만들지 못 했어요");
});
