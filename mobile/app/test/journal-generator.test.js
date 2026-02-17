const test = require("node:test");
const assert = require("node:assert/strict");

const { composeJournalDraft } = require("../src/journal/generator.ts");

test("composeJournalDraft builds event+photo based text", () => {
  const draft = composeJournalDraft({
    dateLocal: "2026-04-10",
    planTitle: "오사카 여행",
    events: [
      {
        id: "e1",
        title: "난바 체크인",
        dateLocal: "2026-04-10",
        category: "stay",
        status: "confirmed",
        colorId: 2,
        startTimeLocal: "15:00",
        locationLabel: "난바"
      },
      {
        id: "e2",
        title: "도톤보리 저녁",
        dateLocal: "2026-04-10",
        category: "food",
        status: "completed",
        colorId: 4,
        startTimeLocal: "19:00",
        locationLabel: "도톤보리"
      }
    ],
    photoCount: 6,
    topLocationLabel: "난바"
  });

  assert.equal(draft.state, "ready");
  assert.match(draft.text, /난바 체크인/);
  assert.match(draft.text, /사진 6장/);
});

test("composeJournalDraft returns fixed empty message when data is insufficient", () => {
  const draft = composeJournalDraft({
    dateLocal: "2026-04-10",
    planTitle: "오사카 여행",
    events: [],
    photoCount: 0,
    topLocationLabel: null,
    generateWithoutData: false
  });

  assert.equal(draft.state, "insufficient_data");
  assert.equal(draft.text, "정보가 부족해 일지를 만들지 못 했어요");
});
