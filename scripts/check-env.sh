#!/usr/bin/env bash

set -euo pipefail

if ! command -v node >/dev/null 2>&1; then
  echo "Node.js is required." >&2
  exit 1
fi

NODE_MAJOR="$(node -p "process.versions.node.split('.')[0]")"
if [ "${NODE_MAJOR}" != "24" ]; then
  echo "Node 24 is required. Current: $(node -v)" >&2
  exit 1
fi

if [ ! -f ".firebaserc" ]; then
  echo ".firebaserc is missing. Set Firebase project id first." >&2
  exit 1
fi

PROJECT_ID="$(node -e "const fs=require('fs');const v=JSON.parse(fs.readFileSync('.firebaserc','utf8'));process.stdout.write(String(v?.projects?.default ?? ''));" 2>/dev/null || true)"
if [ -z "${PROJECT_ID}" ] || [ "${PROJECT_ID}" = "YOUR_FIREBASE_PROJECT_ID" ]; then
  echo "Set a real Firebase project id in .firebaserc (projects.default)." >&2
  exit 1
fi

echo "Environment gate passed: Node $(node -v), Firebase project ${PROJECT_ID}"
