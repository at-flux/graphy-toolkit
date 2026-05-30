#!/usr/bin/env bash
set -euo pipefail
cd /workspace
pnpm install --frozen-lockfile
pnpm typecheck
pnpm build
pnpm test
