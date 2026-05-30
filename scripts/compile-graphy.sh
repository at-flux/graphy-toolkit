#!/usr/bin/env bash
# Build a self-extracting Deno binary at dist/bin/graphy.
# Same script used locally (pnpm compile:graphy) and in CI/release workflows.
set -euo pipefail
ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$ROOT"

DENO_VERSION="${DENO_VERSION:-2.8.1}"
export DENO_DIR="${DENO_DIR:-$ROOT/.deno-cache}"

ensure_deno() {
  if [[ -n "${DENO:-}" && -x "$DENO" ]]; then
    echo "$DENO"
    return
  fi
  if command -v deno >/dev/null 2>&1 && deno --version 2>/dev/null | grep -q "deno $DENO_VERSION"; then
    command -v deno
    return
  fi
  if [[ -x "$ROOT/.deno/bin/deno" ]] && "$ROOT/.deno/bin/deno" --version 2>/dev/null | grep -q "deno $DENO_VERSION"; then
    echo "$ROOT/.deno/bin/deno"
    return
  fi
  echo "Installing Deno v${DENO_VERSION} to ${ROOT}/.deno ..." >&2
  curl -fsSL https://deno.land/install.sh | DENO_INSTALL="$ROOT/.deno" sh -s "v${DENO_VERSION}" >&2
  echo "$ROOT/.deno/bin/deno"
}

if [[ "${SKIP_PNPM:-}" != "1" ]]; then
  CI=true pnpm install --frozen-lockfile
fi

if [[ "${SKIP_BUILD:-}" != "1" ]]; then
  pnpm build
fi

pnpm --filter @at-flux/graphy-toolkit bundle:deno

DENO_BIN="$(ensure_deno)"
"$DENO_BIN" --version

mkdir -p dist/bin
echo "Compiling graphy (may take a few minutes on first run) ..."
"$DENO_BIN" compile \
  --no-check \
  --allow-read --allow-write --allow-run --allow-env --allow-ffi --allow-sys \
  --allow-scripts=npm:sharp@0.34.5 \
  --node-modules-dir=auto \
  --self-extracting \
  -o dist/bin/graphy \
  packages/graphy-toolkit/dist/bundle/graphy-deno.mjs

chmod +x dist/bin/graphy
ls -la dist/bin/graphy
dist/bin/graphy --help 2>&1 | head -20
