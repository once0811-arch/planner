# Development Readiness Checklist

- Date: 2026-02-17
- Scope: Planner MVP v1.1

## Locked

1. Messages path: `plans/{planId}/messages/{messageId}`
2. Offline domain writes: local Outbox -> Functions sync
3. Journal schedule source: `journalJobs` only
4. Firestore domain direct write: denied

## Must Implement Before Feature Work

1. Functions APIs
- `createPlan` (`DONE`: opId 멱등 반영)
- `appendMessage` (`DONE`: opId 멱등 반영)
- `requestChangeProposal` (`DONE`: pending proposal 생성)
- `approveChange` (`DONE`: transaction 기반 승인 반영)
- `deleteToTrash` (`DONE`: 휴지통 30일 메타 포함)
- `restoreFromTrash` (`DONE`: snapshot 복구)
- `enqueueJournalJob` (`DONE`: idempotencyKey 기반 큐 적재)
- `runJournalJob` (`DONE`: 단건 실행/락 처리)
- `runDueJournalJobs` (`DONE`: due job poll + 실행)
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
- timezone precedence (`event.timezone` vs `planTimezone`)
- proposal expiry policy
- trash restore scope

## Local Environment Gate

1. Node 24 active (`nvm use`)
2. JDK 21+ installed for emulator
3. `.firebaserc`에 실제 프로젝트 ID 설정
4. `npx firebase-tools emulators:exec --only firestore,functions \"echo ok\"` passes
5. `npx firebase-tools emulators:exec --only firestore,functions,pubsub \"echo ok\"` passes (scheduled functions validation)
