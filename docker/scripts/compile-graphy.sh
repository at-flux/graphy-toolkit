#!/usr/bin/env bash
set -euo pipefail
cd /workspace

pnpm install --frozen-lockfile 2>/dev/null || pnpm install
pnpm build

mkdir -p dist/bin

pnpm --filter @at-flux/graphy-toolkit bundle:deno
cd packages/graphy-toolkit
deno compile \
  --no-check \
  --allow-read --allow-write --allow-run --allow-env --allow-ffi \
  --allow-scripts=npm:sharp@0.34.5 \
  --node-modules-dir=auto \
  --self-extracting \
  -o ../../dist/bin/graphy \
  dist/bundle/graphy-deno.mjs
cd /workspace

chmod +x dist/bin/graphy
ls -la dist/bin/graphy
file dist/bin/graphy || true
