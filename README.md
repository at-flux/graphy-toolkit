# graphy-toolkit

[![CI](https://github.com/at-flux/graphy-toolkit/actions/workflows/ci.yml/badge.svg)](https://github.com/at-flux/graphy-toolkit/actions/workflows/ci.yml)

pnpm monorepo for **graphy** — a composable stills and clip (photo and video) processing CLI built on Sharp, Zod step schemas, and Stricli.

| Package | npm | Role |
|---------|-----|------|
| [`@at-flux/graphy-toolkit-core`](packages/graphy-toolkit-core/) | [![npm](https://img.shields.io/npm/v/@at-flux/graphy-toolkit-core)](https://www.npmjs.com/package/@at-flux/graphy-toolkit-core) | Pipeline engine + services (library) |
| [`@at-flux/graphy-toolkit`](packages/graphy-toolkit/) | [![npm](https://img.shields.io/npm/v/@at-flux/graphy-toolkit)](https://www.npmjs.com/package/@at-flux/graphy-toolkit) | `graphy` CLI |

## Quick start

```bash
pnpm install && pnpm build
pnpm graphy stills   # reads ./graphy-release.presets.json when present
```

After both packages are on npm:

```bash
pnpm dlx @at-flux/graphy-toolkit stills --presets ./graphy-release.presets.json
```

Portable binary: `pnpm compile:graphy` → `dist/bin/graphy`.

Local pack smoke test (both packages):

```bash
pnpm test:pack
```

Battle-test fixtures (sibling `../test/` folder):

```bash
pnpm test:fixtures   # stills + verify against dist-old
pnpm test            # includes dist-old parity integration when fixtures exist
```

## Commands

| Command | Description |
|---------|-------------|
| `graphy stills` | Run stills pipelines from presets (release, thumbnails, …) |
| `graphy clips` | Run clip pipelines (ffmpeg watermark overlay) |
| `graphy install` | Install agent skill + copy binary to `~/.local/bin` |
| `graphy install skill` | Agent skill only |

### CLI flags (`stills`, `clips`)

| Flag | Preset key | Description |
|------|------------|-------------|
| `--source <path\|glob>` | `sourceRoot` | Directory, file, or glob (`./images`, `./images/*.JPG`) |
| `--dist <dir>` | `distRoot` | Output root; mirrors paths relative to source root |
| `--presets <file>` | — | Presets JSON (default: `graphy-release.presets.json` in cwd) |
| `--pipeline <name>` | — | Run only one named pipeline from presets |
| `--quiet` | `quiet` | Suppress progress UI; stdout summary only |
| `--fail-fast` | — | Stop on first file/pipeline error |

Progress and applied settings go to stderr; the final line on stdout is `done: N input(s), M file(s) written`.

## Presets (`graphy-release.presets.json`)

Presets define reusable **steps** (a dictionary) and **pipelines** that reference step names. Example: [`graphy-release.presets.example.json`](graphy-release.presets.example.json).

```json
{
  "stills": {
    "sourceRoot": "./images",
    "distRoot": "./dist",
    "steps": {
      "3x2": { "type": "resize", "width": 3240, "height": 2160, "scale": "fit" },
      "watermark": { "type": "watermark", "watermark": "./brand.svg" },
      "encoding": { "type": "encoding", "jpegQuality": 84 },
      "aspect-suffix": { "type": "filename", "suffix": "{aspect_ratio}" }
    },
    "pipelines": [
      { "name": "release", "steps": ["3x2", "watermark", "encoding", "aspect-suffix"] }
    ]
  }
}
```

### Step types

| Type | Purpose |
|------|---------|
| `resize` | Fit or crop to width×height; sets `{aspect_ratio}` token from the target box |
| `watermark` | SVG overlay (opacity, sizeRatio, paddingRatio) |
| `filename` | Append suffix; supports `{aspect_ratio}` |
| `copyright` | IFD0 Copyright/Artist when source has none |
| `encoding` | Write JPEG/PNG/WebP/AVIF with quality; merges EXIF |

Parallel branches: use a step array, e.g. `["1x1", "3x1"]` runs both resize steps concurrently.

Pipelines reference `"encoding"` even when omitted from `steps` — a built-in default applies.

Clips presets may use legacy `mappings` (merged into `steps`) and shorthand `pipelines: [["watermark"]]`.

## Development

```bash
pnpm install
pnpm typecheck && pnpm test && pnpm build
cd ../test && node ../graphy-toolkit/packages/graphy-toolkit/dist/bin/graphy.js stills
docker compose -f docker/compose.yml run --rm ci
pnpm compile:graphy
```

Dependency policy: exact versions in packages; 7-day install delay via [`minimumReleaseAge`](pnpm-workspace.yaml) in `pnpm-workspace.yaml` (pnpm workspace config, not npm).

## Release

CI on `main`; `@qiwi/multi-semantic-release` publishes changed packages to npm (OIDC). Deno-compiled binaries attached on release.

See package READMEs for API surface and import paths.

Agent skill for Cursor etc.: [`packages/graphy-toolkit/skills/graphy-toolkit/SKILL.md`](packages/graphy-toolkit/skills/graphy-toolkit/SKILL.md) (shipped in the npm package).
