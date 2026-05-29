# graphy-toolkit

[![CI](https://github.com/at-flux/graphy-toolkit/actions/workflows/ci.yml/badge.svg)](https://github.com/at-flux/graphy-toolkit/actions/workflows/ci.yml)

pnpm monorepo for **graphy** — a composable still/clip release CLI built on Sharp, Zod actions, and Stricli.

| Package | npm | Role |
|---------|-----|------|
| [`@at-flux/graphy-toolkit-core`](packages/graphy-toolkit-core/) | [![npm](https://img.shields.io/npm/v/@at-flux/graphy-toolkit-core)](https://www.npmjs.com/package/@at-flux/graphy-toolkit-core) | Services + Zod actions (library) |
| [`@at-flux/graphy-toolkit`](packages/graphy-toolkit/) | [![npm](https://img.shields.io/npm/v/@at-flux/graphy-toolkit)](https://www.npmjs.com/package/@at-flux/graphy-toolkit) | `graphy` CLI |

## Quick start

```bash
pnpm install && pnpm build
pnpm graphy stills release   # reads ./graphy-release.presets.json when present
```

After both packages are on npm:

```bash
pnpm dlx @at-flux/graphy-toolkit stills release --presets ./graphy-release.presets.json
```

Portable binary: `pnpm compile:graphy` → `dist/bin/graphy`.

Local pack smoke test (both packages):

```bash
pnpm test:pack
```

Battle-test fixtures (sibling `../test/` folder):

```bash
pnpm test:fixtures   # release + verify against dist-old
pnpm test            # includes dist-old parity integration when fixtures exist
```

## Commands

| Command | Description |
|---------|-------------|
| `graphy stills release` | Full pipeline: orient → scale → thumbs → watermark → write |
| `graphy stills size` | Scale + thumbs only |
| `graphy stills watermark` | Size, then watermark + write |
| `graphy clips watermark` | ffmpeg overlay (requires ffmpeg on PATH) |
| `graphy install` | Install agent skill + copy binary to `~/.local/bin` |
| `graphy install skill` | Agent skill only |

### CLI flags (`stills *`)

| Flag | Preset key | Description |
|------|------------|-------------|
| `--source <path\|glob>` | `stills.release.sourceRoot` | Directory, file, or glob (`./images`, `./images/*.JPG`) |
| `--dist <dir>` | `stills.release.distRoot` | Output root; mirrors paths relative to source root |
| `--watermark <svg>` | `stills.release.watermark` | Watermark SVG (required for release/watermark unless preset) |
| `--presets <file>` | — | Presets JSON (default: `graphy-release.presets.json` in cwd) |
| `--copyright <text>` | `stills.size.copyright` | IFD0 Copyright/Artist when source has none |
| `--watermark-mode marked-only\|unmarked-only` | `stills.release.watermarkMode` | Skip watermark when `unmarked-only` |
| `--no-watermark` | — | Alias for `--watermark-mode unmarked-only` |

Watermark tuning (`stills.watermark` preset / not yet CLI flags): `opacity` (0–1), `sizeRatio`, `paddingRatio`.

Encode tuning (`stills.size` preset): `jpegQuality`, `pngQuality`, `webpQuality`, `avifQuality`.

### Presets file (`graphy-release.presets.json`)

CLI flags override preset values. Example: [`graphy-release.presets.example.json`](graphy-release.presets.example.json).

```json
{
  "stills": {
    "release": {
      "sourceRoot": "./images",
      "distRoot": "./dist",
      "watermark": "./brand.svg",
      "watermarkMode": "marked-only"
    },
    "watermark": { "opacity": 0.22, "sizeRatio": 0.1, "paddingRatio": 0.02 },
    "size": { "jpegQuality": 84 }
  }
}
```

## Stills pipeline

1. **Orient** — EXIF rotation first; portrait stays portrait.
2. **Main** — nearest aspect bucket, fit inside max box, never upscale. Suffix e.g. `-3x2`, `-2x3`.
3. **Thumbs** — `thumb-1x1` and `thumb-3x1` from the scaled main raster.
4. **Watermark** — bottom-right SVG overlay (optional).
5. **EXIF** — `keepMetadata()` through resizes; final write merges dimensions + orientation 1.

| Bucket | Max W×H |
|--------|---------|
| `16x9` | 2560×1440 |
| `9x16` | 1440×2560 |
| `3x2` | 3240×2160 |
| `2x3` | 2160×3240 |
| `4x3` | 2560×1920 |
| `3x4` | 1920×2560 |
| `5x4` | 2560×2048 |
| `4x5` | 2048×2560 |
| `1x1` | 2160×2160 |

Per source file (marked mode): `basename-<bucket>.ext`, `basename-thumb-1x1.ext`, `basename-thumb-3x1.ext`.

## Development

```bash
pnpm install
pnpm typecheck && pnpm test && pnpm build
pnpm graphy stills release --source ./path --dist ./out --watermark ./logo.svg
docker compose -f docker/compose.yml run --rm ci
pnpm compile:graphy
```

Dependency policy: exact versions in packages, `minimum-release-age=7` days in [`.npmrc`](.npmrc), [Renovate](renovate.json) with 7-day minimum.

## Release

CI on `main`; `@qiwi/multi-semantic-release` publishes changed packages to npm (OIDC). Deno-compiled binaries attached on release.

See package READMEs for API surface and import paths.
