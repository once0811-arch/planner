# Development Readiness Checklist

- Date: 2026-02-17
- Scope: Planner MVP v1.1

## Locked

1. Messages path: `plans/{planId}/messages/{messageId}`
2. Offline domain writes: local Outbox -> Functions sync
3. Journal schedule source: `journalJobs` only
4. Firestore domain direct write: denied
5. Journal due time conversion: local `03:00/08:00` -> `dueAtUtc` (IANA timezone, DST-aware)
6. `createPlan` idempotency: explicit `opId` only (no deterministic fallback from business fields)
7. `approveChange` mutation guard: target-type whitelist + system-field patch deny + version increment
8. Event color: default palette assign + user override allowed
9. Trash purge: run once daily at `03:00` (`Asia/Seoul`)

## Must Implement Before Feature Work

1. Functions APIs
- `createPlan` (`PARTIAL`: opId 입력은 반영, deterministic fallback 제거 필요)
- `appendMessage` (`DONE`: opId 멱등 반영)
- `requestChangeProposal` (`DONE`: pending proposal 생성)
- `approveChange` (`PARTIAL`: transaction 반영 완료, patch guard/version 증분 보강 필요)
- `deleteToTrash` (`DONE`: 휴지통 30일 메타 포함)
- `restoreFromTrash` (`DONE`: snapshot 복구)
- `enqueueJournalJob` (`DONE`: idempotencyKey 기반 큐 적재)
- `runJournalJob` (`DONE`: 단건 실행/락 처리)
- `runDueJournalJobs` (`PARTIAL`: due poll 실행, nextRetryAt 준수 보강 필요)
- `reconcileMissingJournalJobs` (`DONE`: 누락 잡 보정 생성)

2. Scheduler reliability
- due-job runner every 5 minutes (`DONE`)
- lock/idempotency (`idempotencyKey`, `lockOwner`, `lockAt`) (`DONE`)
- enqueue failure recovery job (`DONE`: daily reconcile)

3. Outbox sync protocol
- `opId` idempotency (`DONE`: 함수 입력 반영)
- FIFO replay and retry (`PENDING`: 모바일 Outbox 미구현)
- duplicate-suppression on backend (`PARTIAL`: 핵심 함수 opId dedupe, 전체 API 확장 필요)

4. Remaining schema decisions
- proposal expiry policy
- trash restore scope

## Local Environment Gate

1. `npm run check:env` passes (Node24 + `.firebaserc` project id)
2. `npm run check:backend` passes
3. `npm run check:mobile:typecheck` passes
4. `npm run check:mobile:doctor` passes
5. `npm run check:emulator` passes (JDK 21+ required)
