#!/usr/bin/env bash

set -euo pipefail

"$(dirname "$0")/check-env.sh" >/dev/null

if ! command -v java >/dev/null 2>&1; then
  echo "JDK 21+ is required for Firebase emulators. Install Java and retry." >&2
  exit 1
fi

if ! java -version >/dev/null 2>&1; then
  echo "Java is installed but runtime is not available. Install a working JDK 21+ and retry." >&2
  exit 1
fi

PROJECT_ID="$(node -e "const fs=require('fs');const v=JSON.parse(fs.readFileSync('.firebaserc','utf8'));process.stdout.write(String(v?.projects?.default ?? ''));" 2>/dev/null || true)"
if [ -z "${PROJECT_ID}" ] || [ "${PROJECT_ID}" = "YOUR_FIREBASE_PROJECT_ID" ]; then
  echo "Set a real Firebase project id in .firebaserc (projects.default)." >&2
  exit 1
fi

npx firebase-tools emulators:exec \
  --project "${PROJECT_ID}" \
  --only firestore,functions,pubsub \
  "echo ok"
