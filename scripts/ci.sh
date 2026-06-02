#!/usr/bin/env bash
# Mirrors .github/workflows/ci.yml test job — run locally before push.
set -euo pipefail
ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$ROOT"

node -e "const v=process.versions.node.split('.')[0]; if (v!=='24') { console.error('Expected Node 24 (see .nvmrc), got', process.version); process.exit(1) }"

CI=true pnpm install --frozen-lockfile
pnpm format:check
pnpm lint
pnpm typecheck
pnpm build
pnpm test
pnpm test:pack
