const test = require("node:test");
const assert = require("node:assert/strict");

const { sanitizePatch, sanitizeDraftData, nextVersion } = require("../lib/api/approveChangePolicy.js");

test("sanitizePatch keeps only event whitelist fields", () => {
  const patch = sanitizePatch("event", {
    title: "오사카 숙소 체크인",
    status: "confirmed",
    ownerUid: "user-x",
    updatedAt: "2026-02-17T00:00:00.000Z"
  });

  assert.deepEqual(patch, {
    title: "오사카 숙소 체크인",
    status: "confirmed"
  });
});

test("sanitizeDraftData strips immutable fields", () => {
  const draft = sanitizeDraftData("dayMemo", {
    dateLocal: "2026-03-01",
    memo: "저녁 예약 확인",
    planId: "plan-x",
    isDeleted: true,
    version: 99
  });

  assert.deepEqual(draft, {
    dateLocal: "2026-03-01",
    memo: "저녁 예약 확인"
  });
});

test("nextVersion falls back safely for invalid version values", () => {
  assert.equal(nextVersion(undefined), 2);
  assert.equal(nextVersion("3"), 4);
  assert.equal(nextVersion("not-a-number"), 2);
  assert.equal(nextVersion(NaN), 2);
});
