#!/usr/bin/env bash
set -euo pipefail
cd /workspace
pnpm install --frozen-lockfile 2>/dev/null || pnpm install
pnpm typecheck
pnpm build
pnpm test
