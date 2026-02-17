const test = require("node:test");
const assert = require("node:assert/strict");

const {
  isEligibleForJournal,
  selectTopJournalEventIds
} = require("../lib/jobs/journalPolicy.js");

test("isEligibleForJournal excludes temporary status only", () => {
  assert.equal(isEligibleForJournal("temporary"), false);
  assert.equal(isEligibleForJournal("confirmed"), true);
  assert.equal(isEligibleForJournal("completed"), true);
  assert.equal(isEligibleForJournal(null), true);
});

test("selectTopJournalEventIds keeps highest priority up to 5", () => {
  const ids = selectTopJournalEventIds([
    { id: "e1", status: "confirmed", importanceScore: 30, startTimeLocal: "09:00", category: "todo" },
    { id: "e2", status: "completed", importanceScore: 90, startTimeLocal: "11:00", category: "food" },
    { id: "e3", status: null, importanceScore: null, startTimeLocal: null, category: "etc" },
    { id: "e4", status: "temporary", importanceScore: 99, startTimeLocal: "08:00", category: "transport" },
    { id: "e5", status: "confirmed", importanceScore: 20, startTimeLocal: null, category: "stay" },
    { id: "e6", status: "completed", importanceScore: 80, startTimeLocal: "15:00", category: "shopping" },
    { id: "e7", status: "confirmed", importanceScore: 10, startTimeLocal: null, category: "todo" }
  ]);

  assert.deepEqual(ids, ["e2", "e6", "e1", "e5", "e7"]);
  assert.equal(ids.includes("e4"), false);
});
