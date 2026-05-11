#!/usr/bin/env bash
set -euo pipefail

REPO_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "${REPO_ROOT}"

DEFAULT_MESSAGE="Update Research app"
COMMIT_MESSAGE="${1:-${DEFAULT_MESSAGE}}"

git add .

if git diff --cached --quiet; then
  echo "No Git changes to commit."
else
  git commit -m "${COMMIT_MESSAGE}"
fi

git push
npm run backup
