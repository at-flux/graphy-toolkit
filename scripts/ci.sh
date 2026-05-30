#!/usr/bin/env bash
# Mirrors .github/workflows/ci.yml test job — run locally before push.
set -euo pipefail
ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$ROOT"

CI=true pnpm install --frozen-lockfile
pnpm typecheck
pnpm build
pnpm test
pnpm test:pack
