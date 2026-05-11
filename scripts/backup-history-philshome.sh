#!/usr/bin/env bash
set -euo pipefail

REPO_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
DRIVE_ROOT="/Volumes/PhilsHome"
BACKUP_ROOT="${DRIVE_ROOT}/ResearchBackups"
HISTORY_ROOT="${BACKUP_ROOT}/history"
RETENTION_COUNT="${RESEARCH_BACKUP_HISTORY_RETENTION:-20}"

if [[ ! -d "${DRIVE_ROOT}" ]]; then
  echo "PhilsHome is not mounted. Skipping external backup."
  exit 0
fi

if ! mkdir -p "${HISTORY_ROOT}" 2>/dev/null; then
  echo "PhilsHome is mounted, but ${HISTORY_ROOT} could not be created. Check drive permissions. Skipping external backup."
  exit 0
fi

SNAPSHOT_NAME="$(date '+%Y-%m-%d_%H-%M-%S')"
SNAPSHOT_DIR="${HISTORY_ROOT}/${SNAPSHOT_NAME}"
mkdir -p "${SNAPSHOT_DIR}"

rsync -av \
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
  "${SNAPSHOT_DIR}/"

SNAPSHOTS=()
while IFS= read -r snapshot; do
  SNAPSHOTS+=("${snapshot}")
done < <(find "${HISTORY_ROOT}" -mindepth 1 -maxdepth 1 -type d -print | sort)
SNAPSHOT_COUNT="${#SNAPSHOTS[@]}"

if (( SNAPSHOT_COUNT > RETENTION_COUNT )); then
  DELETE_COUNT=$((SNAPSHOT_COUNT - RETENTION_COUNT))
  for ((i = 0; i < DELETE_COUNT; i++)); do
    echo "Deleting old history snapshot: ${SNAPSHOTS[$i]}"
    rm -rf "${SNAPSHOTS[$i]}"
  done
fi

RETAINED=()
while IFS= read -r snapshot; do
  RETAINED+=("${snapshot}")
done < <(find "${HISTORY_ROOT}" -mindepth 1 -maxdepth 1 -type d -print | sort)

echo "Research history snapshot created: ${SNAPSHOT_DIR}"
echo "History snapshots retained: ${#RETAINED[@]}"
