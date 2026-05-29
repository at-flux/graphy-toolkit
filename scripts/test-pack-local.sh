#!/usr/bin/env bash
# Pack both workspace packages and smoke-test the CLI tarball (simulates post-publish install).
set -euo pipefail
ROOT="$(cd "$(dirname "$0")/.." && pwd)"
STAGING="$(mktemp -d)"
trap 'rm -rf "$STAGING"' EXIT

cd "$ROOT"
pnpm build

CORE_TGZ="$STAGING/core.tgz"
CLI_TGZ="$STAGING/cli.tgz"
pnpm --filter @at-flux/graphy-toolkit-core pack --pack-destination "$STAGING" >/dev/null
mv "$STAGING"/at-flux-graphy-toolkit-core-*.tgz "$CORE_TGZ"

node -e "
const fs = require('fs');
const path = require('path');
const pkgPath = path.join('$ROOT', 'packages/graphy-toolkit/package.json');
const pkg = JSON.parse(fs.readFileSync(pkgPath, 'utf8'));
pkg.dependencies['@at-flux/graphy-toolkit-core'] = 'file:$CORE_TGZ';
fs.writeFileSync(path.join('$STAGING', 'cli-package.json'), JSON.stringify(pkg, null, 2));
"

mkdir -p "$STAGING/cli-pack"
cp -r "$ROOT/packages/graphy-toolkit/dist" "$STAGING/cli-pack/dist"
cp -r "$ROOT/packages/graphy-toolkit/skills" "$STAGING/cli-pack/skills"
cp "$ROOT/packages/graphy-toolkit/README.md" "$STAGING/cli-pack/"
cp "$STAGING/cli-package.json" "$STAGING/cli-pack/package.json"
(cd "$STAGING/cli-pack" && npm pack --pack-destination "$STAGING" >/dev/null)
mv "$STAGING"/at-flux-graphy-toolkit-*.tgz "$CLI_TGZ"

WORK="$STAGING/work"
mkdir -p "$WORK"
cd "$WORK"
npm init -y >/dev/null 2>&1
npm install "$CORE_TGZ" "$CLI_TGZ" >/dev/null 2>&1

FIXTURE="$ROOT/../test"
OUT="$STAGING/out"
(
  cd "$FIXTURE"
  "$WORK/node_modules/.bin/graphy" stills \
    --source "./images/P1017123.JPG" \
    --dist "$OUT" \
    --pipeline release
)

test "$(ls "$OUT" | wc -l)" -eq 1
echo "pack smoke ok: 1 release file in $OUT"
