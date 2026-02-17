# Planner Functions

## Runtime

- Firebase Functions v2
- Node 24 (deployment target)
- TypeScript strict mode
- JDK 21+ required for Firestore emulator execution

## Commands

- Install: `npm install`
- Build: `npm run build`
- Watch: `npm run watch`

## Current API Surface

1. `createPlan`
2. `appendMessage`
3. `requestChangeProposal`
4. `approveChange`
5. `deleteToTrash`
6. `restoreFromTrash`
7. `enqueueJournalJob`
8. `runJournalJob`
9. `runDueJournalJobs` (scheduled every 5 minutes)
10. `reconcileMissingJournalJobs` (scheduled daily)

## Notes

- Domain writes are intentionally function-gated.
- Offline mutations should be replayed through function APIs using `opId` idempotency.
- Local emulator may use host Node version if Node 24 is not active.
- Several handlers are minimum-MVP implementations and require business-rule hardening before release.
