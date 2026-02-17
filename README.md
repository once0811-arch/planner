# Planner

Planner MVP development workspace.

## Directory

- `docs/architecture`: product architecture and review documents
- `docs/schema`: backend schema contract documents
- `docs/review`: readiness checklist and review artifacts
- `infra/firebase`: Firestore rules and index definitions
- `backend/functions`: Firebase Functions codebase (TypeScript)
- `mobile/app`: mobile app codebase (Expo + React Native)

## Quick Start

1. Use Node 24 (`nvm use` with `.nvmrc`).
2. Set Firebase project id in `.firebaserc`.
3. Install backend dependencies:
   - `cd backend/functions && npm install`
4. Build backend:
   - `npm run build`
5. Start emulator from repo root:
   - `npx firebase-tools emulators:start --only firestore,functions,pubsub`

## Environment Requirements

1. JDK 21+ is required by current Firebase emulator tooling.
2. Local Node 24 is recommended to match Functions runtime.

## Contract First

- Product source of truth: `docs/architecture/MVP_ARCHITECTURE_AND_REVIEW.md`
- Backend source of truth: `docs/schema/BACKEND_SCHEMA_SPEC.md`
- Do not implement domain writes outside Functions API.
