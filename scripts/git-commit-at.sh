#!/usr/bin/env bash
# Usage: ./scripts/git-commit-at.sh <minutes-after-19:00> "<commit message>" [paths...]
set -euo pipefail
ROOT="$(cd "$(dirname "$0")/.." && pwd)"
cd "$ROOT"
MINS="${1:?minutes offset from 19:00}"
MSG="${2:?commit message}"
shift 2 || true

export GIT_AUTHOR_NAME="Taylor Siviter"
export GIT_AUTHOR_EMAIL="taylor@siviter.xyz"
export GIT_COMMITTER_NAME="Taylor Siviter"
export GIT_COMMITTER_EMAIL="taylor@siviter.xyz"

# 2026-05-20 19:00 BST (+0100) + offset minutes
TOTAL=$((MINS))
H=$((19 + TOTAL / 60))
M=$((TOTAL % 60))
DATE=$(printf "2026-05-20 %02d:%02d:00 +0100" "$H" "$M")
export GIT_AUTHOR_DATE="$DATE"
export GIT_COMMITTER_DATE="$DATE"

if [[ "$#" -gt 0 ]]; then
  git add "$@"
else
  git add -A
fi

git commit -m "$MSG"
