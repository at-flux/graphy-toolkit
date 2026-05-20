#!/usr/bin/env bash
set -euo pipefail
ROOT="$(cd "$(dirname "$0")/.." && pwd)"
cd "$ROOT"

pnpm install --frozen-lockfile 2>/dev/null || pnpm install
pnpm build
pnpm --filter @at-flux/graphy-toolkit bundle:deno

DENO="${DENO:-}"
if [[ -z "$DENO" && -x "$ROOT/.deno/bin/deno" ]]; then
  DENO="$ROOT/.deno/bin/deno"
fi
if [[ -z "$DENO" ]] && command -v deno >/dev/null 2>&1; then
  DENO="deno"
fi
if [[ -z "$DENO" ]]; then
  curl -fsSL https://deno.land/install.sh | DENO_INSTALL="$ROOT/.deno" sh
  DENO="$ROOT/.deno/bin/deno"
fi
export PATH="$(dirname "$DENO"):$PATH"

mkdir -p dist/bin

echo "Compiling graphy (this may take several minutes)..."
cd packages/graphy-toolkit
"$DENO" compile \
  --no-check \
  --allow-read --allow-write --allow-run --allow-env --allow-ffi \
  --allow-scripts=npm:sharp@0.34.5 \
  --node-modules-dir=auto \
  --self-extracting \
  -o ../../dist/bin/graphy \
  dist/bundle/graphy-deno.mjs
cd "$ROOT"

chmod +x dist/bin/graphy
ls -la dist/bin/graphy
file dist/bin/graphy || true
dist/bin/graphy --help 2>&1 | head -20 || dist/bin/graphy stills 2>&1 | head -5 || true
