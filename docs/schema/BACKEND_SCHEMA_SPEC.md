# Backend Schema Spec (Draft v0.2)

- Date: 2026-02-17
- Scope: Firestore schema for Planner MVP
- Principle: User autonomy first, approval-gated writes, graceful degradation on permission denial

## 1. Global Conventions

1. Timestamp fields use Firestore `Timestamp` in UTC.
2. Local date uses `YYYY-MM-DD` (`dateLocal`), local time uses `HH:mm` (`timeLocal`).
3. ID strategy uses Firestore auto ID by default. `opId` idempotency paths may use deterministic document IDs.
4. All user-facing domain documents carry common metadata (`journalJobs` excluded):
   - `ownerUid` (string, required)
   - `createdAt` (timestamp, required)
   - `updatedAt` (timestamp, required)
   - `schemaVersion` (number, required, default `1`)
   - `isDeleted` (boolean, required, default `false`)
   - `version` (number, required, default `1`)
   - `lastOpId` (string, optional, idempotency tracing)
5. User-facing optional values (`status`, `category`, time) are nullable by design.
6. Journal batch runtime source-of-truth is `journalJobs` only (no runtime full plan scan).
7. Offline manual edits are persisted to local Outbox first, then synced through backend functions.

## 2. Enum Dictionary

1. Event status: `temporary`, `confirmed`, `completed`, `null`
2. Event category: `transport`, `stay`, `todo`, `shopping`, `food`, `etc`, `null`
3. Proposal type: `create`, `update`, `delete`
4. Proposal approval state: `pending`, `approved`, `rejected`, `expired`
5. Journal day state: `draft`, `published`, `failed`
6. Journal job phase: `generate`, `publish`, `backfill`
7. Journal job state: `queued`, `running`, `done`, `failed`, `deadletter`
8. Actor/source:
   - `actor`: `user`, `system`
   - `source`: `chat`, `ocr`, `calendar`, `journal`, `batch`
9. Message role: `user`, `assistant`, `system`

## 3. Collection Schemas

## 3.1 `users/{uid}`

| Field | Type | Required | Default | Notes |
|---|---|---:|---|---|
| uid | string | yes | doc id | Same as auth uid |
| provider | string | yes | - | `google` or `kakao` |
| displayName | string | no | null | |
| photoUrl | string | no | null | |
| locale | string | yes | `ko-KR` | |
| createdAt | timestamp | yes | server time | |
| updatedAt | timestamp | yes | server time | |

## 3.2 `settings/{uid}`

| Field | Type | Required | Default | Notes |
|---|---|---:|---|---|
| ownerUid | string | yes | uid | |
| journalGenerateWithoutData | boolean | yes | false | Plan-based generation fallback |
| galleryPermissionState | string | yes | `unknown` | `unknown/granted/denied/limited` |
| locationPermissionState | string | yes | `unknown` | `unknown/granted/denied/limited` |
| createdAt | timestamp | yes | server time | |
| updatedAt | timestamp | yes | server time | |

## 3.3 `plans/{planId}`

| Field | Type | Required | Default | Notes |
|---|---|---:|---|---|
| ownerUid | string | yes | - | |
| title | string | yes | - | |
| destination | string | yes | - | |
| startDateLocal | string | yes | - | `YYYY-MM-DD` |
| endDateLocal | string | yes | - | `YYYY-MM-DD` |
| planTimezone | string | yes | - | IANA timezone id |
| isForeign | boolean | yes | false | Globe icon condition |
| journalEnabledAt | timestamp | no | null | Set when user enables journal for the plan |
| createdBy | string | yes | `user` | `user/system` |
| updatedBy | string | yes | `user` | `user/system` |
| source | string | yes | `chat` | |
| createdAt | timestamp | yes | server time | |
| updatedAt | timestamp | yes | server time | |
| schemaVersion | number | yes | 1 | |
| isDeleted | boolean | yes | false | Soft delete |
| deletedAt | timestamp | no | null | |
| deletedBy | string | no | null | |
| version | number | yes | 1 | Optimistic locking |
| lastOpId | string | no | null | Idempotency trace |

## 3.4 `plans/{planId}/events/{eventId}`

| Field | Type | Required | Default | Notes |
|---|---|---:|---|---|
| ownerUid | string | yes | - | Must equal parent plan owner |
| planId | string | yes | - | Redundant key for query/index |
| title | string | yes | - | |
| status | string/null | no | `confirmed` | Can be manually cleared to null |
| category | string/null | no | null | |
| dateLocal | string | yes | - | `YYYY-MM-DD` |
| startTimeLocal | string | no | null | `HH:mm` |
| endTimeLocal | string | no | null | `HH:mm` |
| timezone | string | no | null | Defaults to plan timezone if null |
| memo | string | no | null | |
| locationName | string | no | null | |
| lat | number | no | null | |
| lng | number | no | null | |
| colorId | number | yes | random 0..7 | Assigned once at create and fixed for lifecycle |
| importanceScore | number | no | null | Journal selector input |
| departAtLocal | string | no | null | Transport events only |
| departTz | string | no | null | Transport events only |
| arriveAtLocal | string | no | null | Transport events only |
| arriveTz | string | no | null | Transport events only |
| createdBy | string | yes | `user` | |
| updatedBy | string | yes | `user` | |
| source | string | yes | `chat` | |
| createdAt | timestamp | yes | server time | |
| updatedAt | timestamp | yes | server time | |
| schemaVersion | number | yes | 1 | |
| isDeleted | boolean | yes | false | |
| deletedAt | timestamp | no | null | |
| deletedBy | string | no | null | |
| version | number | yes | 1 | |

Validation:
1. If both `startTimeLocal` and `endTimeLocal` exist, `endTimeLocal >= startTimeLocal`.
2. If category is `transport`, `departTz` and `arriveTz` are required.

## 3.5 `plans/{planId}/dayMemos/{dayMemoId}`

| Field | Type | Required | Default | Notes |
|---|---|---:|---|---|
| ownerUid | string | yes | - | |
| planId | string | yes | - | |
| dateLocal | string | yes | - | One memo per date per plan |
| memo | string | yes | - | |
| createdAt | timestamp | yes | server time | |
| updatedAt | timestamp | yes | server time | |
| schemaVersion | number | yes | 1 | |
| isDeleted | boolean | yes | false | |
| version | number | yes | 1 | |

## 3.6 `plans/{planId}/journalDays/{journalDayId}`

| Field | Type | Required | Default | Notes |
|---|---|---:|---|---|
| ownerUid | string | yes | - | |
| planId | string | yes | - | |
| dateLocal | string | yes | - | Unique with `planId` |
| state | string | yes | `draft` | `draft/published/failed` |
| publishAtLocal0800 | timestamp | yes | - | |
| publishedAt | timestamp | no | null | |
| summary | string | no | null | |
| selectedEventIds | array<string> | yes | `[]` | Max 5 events |
| generationInputHash | string | no | null | Idempotency key |
| failureReasonCode | string | no | null | |
| createdAt | timestamp | yes | server time | |
| updatedAt | timestamp | yes | server time | |
| schemaVersion | number | yes | 1 | |
| isDeleted | boolean | yes | false | |
| version | number | yes | 1 | |

## 3.7 `plans/{planId}/journalEntries/{entryId}`

| Field | Type | Required | Default | Notes |
|---|---|---:|---|---|
| ownerUid | string | yes | - | |
| planId | string | yes | - | |
| journalDayId | string | yes | - | Parent day link |
| type | string | yes | `etc` | Category-aligned type |
| sourceEventId | string | no | null | |
| importanceScore | number | no | null | |
| text | string | yes | - | |
| images | array<string> | yes | `[]` | Storage paths |
| sources | array<string> | yes | `[]` | Evidence source markers |
| sortOrder | number | yes | 0 | |
| createdAt | timestamp | yes | server time | |
| updatedAt | timestamp | yes | server time | |
| schemaVersion | number | yes | 1 | |
| isDeleted | boolean | yes | false | |
| version | number | yes | 1 | |

## 3.8 `plans/{planId}/photoCandidates/{photoId}`

| Field | Type | Required | Default | Notes |
|---|---|---:|---|---|
| ownerUid | string | yes | - | |
| planId | string | yes | - | |
| localAssetId | string | no | null | Device-local identifier hash |
| capturedAt | timestamp | yes | - | |
| capturedTz | string | no | null | |
| lat | number | no | null | |
| lng | number | no | null | |
| thumbnailPath | string | no | null | |
| originalPath | string | no | null | Optional |
| qualityScore | number | no | null | |
| createdAt | timestamp | yes | server time | |
| updatedAt | timestamp | yes | server time | |
| schemaVersion | number | yes | 1 | |
| isDeleted | boolean | yes | false | |
| version | number | yes | 1 | |

## 3.9 `plans/{planId}/changeProposals/{proposalId}`

| Field | Type | Required | Default | Notes |
|---|---|---:|---|---|
| ownerUid | string | yes | - | |
| planId | string | yes | - | |
| proposalType | string | yes | - | `create/update/delete` |
| approvalState | string | yes | `pending` | |
| bundleId | string | no | null | Single-update is bundle-only |
| operations | array<object> | yes | `[]` | Proposed mutations |
| snapshotBefore | map | no | null | |
| snapshotAfter | map | no | null | |
| requestedAt | timestamp | yes | server time | |
| approvedAt | timestamp | no | null | |
| rejectedAt | timestamp | no | null | |
| expiresAt | timestamp | no | null | |
| createdBy | string | yes | `system` | |
| updatedBy | string | yes | `system` | |
| source | string | yes | `chat` | |
| createdAt | timestamp | yes | server time | |
| updatedAt | timestamp | yes | server time | |
| schemaVersion | number | yes | 1 | |
| isDeleted | boolean | yes | false | |
| deletedAt | timestamp | no | null | |
| deletedBy | string | no | null | |
| version | number | yes | 1 | |
| lastOpId | string | no | null | Idempotency trace |

`operations[]` item draft:
1. `op`: `create|update|delete`
2. `targetType`: `plan|event|dayMemo`
3. `targetId`: nullable string
4. `patch`: map (for update)
5. `draftData`: map (for create)
6. `overrideAllowed`: boolean

## 3.10 `journalJobs/{jobId}`

| Field | Type | Required | Default | Notes |
|---|---|---:|---|---|
| planId | string | yes | - | |
| ownerUid | string | yes | - | |
| dateLocal | string | yes | - | |
| phase | string | yes | - | `generate/publish/backfill` |
| timezone | string | yes | - | |
| dueAtUtc | timestamp | yes | - | |
| state | string | yes | `queued` | |
| attemptCount | number | yes | 0 | |
| nextRetryAt | timestamp | no | null | |
| idempotencyKey | string | yes | - | `planId+dateLocal+phase` |
| lockOwner | string | no | null | |
| lockAt | timestamp | no | null | |
| lastError | string | no | null | |
| createdAt | timestamp | yes | server time | |
| updatedAt | timestamp | yes | server time | |
| lastOpId | string | no | null | Idempotency trace |

## 3.11 `plans/{planId}/messages/{messageId}`

| Field | Type | Required | Default | Notes |
|---|---|---:|---|---|
| ownerUid | string | yes | - | |
| planId | string | yes | - | |
| role | string | yes | - | `user/assistant/system` |
| text | string | no | null | |
| imagePaths | array<string> | yes | `[]` | Storage paths |
| linkedProposalId | string | no | null | |
| source | string | yes | `chat` | |
| createdAt | timestamp | yes | server time | |
| updatedAt | timestamp | yes | server time | |
| createdBy | string | yes | `user` | |
| updatedBy | string | yes | `user` | |
| schemaVersion | number | yes | 1 | |
| isDeleted | boolean | yes | false | |
| deletedAt | timestamp | no | null | |
| deletedBy | string | no | null | |
| version | number | yes | 1 | |
| lastOpId | string | no | null | Idempotency trace |

## 3.12 `trash/{trashId}`

| Field | Type | Required | Default | Notes |
|---|---|---:|---|---|
| ownerUid | string | yes | - | |
| planId | string | no | null | |
| entityType | string | yes | - | `plan/event/dayMemo/journalDay/journalEntry` |
| entityPath | string | yes | - | Original document path |
| state | string | yes | `in_trash` | `in_trash/restored/purged` |
| snapshot | map | yes | - | Original content |
| deletedAt | timestamp | yes | server time | |
| purgeAt | timestamp | yes | deletedAt + 30d | |
| restoredAt | timestamp | no | null | |
| createdAt | timestamp | yes | server time | |
| updatedAt | timestamp | yes | server time | |
| schemaVersion | number | yes | 1 | |
| version | number | yes | 1 | |
| lastOpId | string | no | null | Idempotency trace |

## 4. Write Path Policy

1. Client direct write allowed:
   - `users/{uid}`
   - `settings/{uid}`
2. Client direct write denied for domain collections:
   - `plans`, `events`, `dayMemos`, `journalDays`, `journalEntries`, `photoCandidates`, `changeProposals`, `messages`, `trash`, `journalJobs`
3. Domain mutations must pass backend functions:
   - `createPlan`
   - `appendMessage`
   - `requestChangeProposal`
   - `approveChange`
   - `deleteToTrash`
   - `restoreFromTrash`
   - `enqueueJournalJob` / `runJournalJob`

## 4.1 Offline Outbox Policy

1. App stores offline domain mutations in local Outbox (`opId`, `opType`, `payload`, `createdAt`).
2. On reconnect, app replays Outbox to backend functions in FIFO order.
3. Backend must treat `opId` as idempotency key to avoid duplicate writes.
4. Firestore direct writes for domain collections remain disallowed even in offline mode.

## 5. Transaction and Idempotency Rules

1. `approveChange` must be transactional:
   - Read proposal (`pending`)
   - Apply operation documents
   - Mark proposal as `approved`
   - Increment target `version`
2. `journalJobs` execution lock:
   - Acquire lock only if `state=queued|failed` and not locked
   - Write `running` + `lockOwner` + `lockAt`
   - Finalize to `done` or `failed`
3. Duplicate job prevention uses `idempotencyKey`.
4. Scheduler runner only polls due jobs from `journalJobs` (`dueAtUtc <= now`).

## 6. Open Decisions Before Final Schema Freeze

1. Confirm timezone precedence (`event.timezone` vs `planTimezone`) for journal date slicing.
2. Confirm proposal expiry policy (`expiresAt` and cleanup).
3. Confirm trash restore scope (event-only vs all related entities).
