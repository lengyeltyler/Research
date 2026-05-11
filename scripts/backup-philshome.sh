#!/usr/bin/env bash
set -euo pipefail

REPO_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
DRIVE_ROOT="/Volumes/PhilsHome"
BACKUP_DIR="${DRIVE_ROOT}/ResearchBackups/Research"
HISTORY_SCRIPT="${REPO_ROOT}/scripts/backup-history-philshome.sh"

if [[ ! -d "${DRIVE_ROOT}" ]]; then
  echo "PhilsHome is not mounted. Skipping external backup."
  exit 0
fi

if ! mkdir -p "${BACKUP_DIR}" 2>/dev/null; then
  echo "PhilsHome is mounted, but ${BACKUP_DIR} could not be created. Check drive permissions. Skipping external backup."
  exit 0
fi

rsync -av --delete \
  --exclude "node_modules/" \
  --exclude "dist/" \
  --exclude ".git/" \
  --exclude ".DS_Store" \
  --exclude "*.tsbuildinfo" \
  --exclude ".vite/" \
  --exclude ".cache/" \
  --exclude "npm-debug.log*" \
  --exclude "yarn-debug.log*" \
  --exclude "yarn-error.log*" \
  "${REPO_ROOT}/" \
  "${BACKUP_DIR}/"

echo "Research mirror backup updated: ${BACKUP_DIR}"

"${HISTORY_SCRIPT}"
