# graphy-toolkit

pnpm monorepo for **graphy** — still and clip release tooling ported from `image-release`, with composable Zod actions and a Stricli CLI.

## Packages

| Package | Description |
|---------|-------------|
| `@at-flux/graphy-toolkit-core` | Services (`stillService`, `clipService`, …) and actions |
| `@at-flux/graphy-toolkit` | CLI binary `graphy` |

## Commands

```bash
graphy stills release --source ./images --dist ./dist --watermark ./brand.svg
graphy stills size --source ./images --dist ./dist
graphy stills watermark --source ./images --dist ./dist --watermark ./brand.svg
graphy clips watermark --source ./clips --dist ./dist --watermark ./brand.svg
graphy install
graphy install skill
```

Presets: copy [`graphy-presets.example.json`](graphy-presets.example.json) to `graphy-presets.json` and pass `--presets graphy-presets.json`.

`--no-watermark` on stills maps to `--watermark-mode unmarked-only`.

## Development (Docker)

```bash
pnpm install
pnpm dev:shell          # interactive shell with repo mounted
docker compose -f docker/compose.yml run --rm ci
pnpm compile:graphy   # Deno portable binary -> dist/bin/graphy
```

## Stills pipeline

1. EXIF orientation (`rotate()`)
2. Main image — fit inside nearest aspect bucket (no upscale)
3. Thumbnails `thumb-1x1` and `thumb-3x1` from scaled main
4. Optional watermark + EXIF merge on write

See `image-release/README.md` for bucket table reference.

## Clips (v1)

`clips watermark` only — requires **ffmpeg** on `PATH`. No `clips release` command.

## Install

- `graphy install` — installs the agent skill and copies `dist/bin/graphy` to `~/.local/bin` when the binary exists
- `graphy install skill` — skill only (`npx skills add` for this repo’s `graphy-toolkit` skill)

## Portable binary

```bash
pnpm compile:graphy   # local: scripts/compile-graphy-local.sh + Deno --self-extracting
pnpm compile:graphy:docker   # when Docker is available
```

Output: `dist/bin/graphy` (~300MB with Sharp natives). First run extracts beside the binary.

## Release

CI runs tests and build; release workflow publishes npm packages and attaches Deno-compiled binaries to GitHub releases.
