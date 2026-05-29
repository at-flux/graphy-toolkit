---
name: graphy-toolkit
description: Run graphy stills and clip pipelines (Sharp + ffmpeg), graphy-release.presets.json, and graphy install. Use when optimizing photos for web delivery, watermarking stills or clips, or setting up the graphy CLI.
---

# graphy-toolkit

## When to use

- Batch still export via composable step pipelines (resize, watermark, EXIF, filenames)
- Overlay watermark on video clips (ffmpeg)
- Install the graphy CLI or this skill on the user machine

## CLI

```bash
graphy stills --pipeline release
graphy stills --source ./images/P1017123.JPG
graphy clips
graphy install
graphy install skill
```

Auto-loads `graphy-release.presets.json` from cwd when `--presets` is omitted.

## Presets

`graphy-release.presets.json` — `stills` / `clips` sections with `steps` dict and named `pipelines`. CLI flags override `sourceRoot`, `distRoot`, and filter pipelines via `--pipeline`.

Step types: `resize`, `watermark`, `filename`, `copyright`, `encoding`. Parallel groups: `["1x1", "3x1"]`.

## Requirements

- Node 20+ (Sharp)
- ffmpeg on PATH for `graphy clips`
- Watermark SVG path required (not bundled)

## Portable binary

`pnpm compile:graphy` — Deno `compile --self-extracting` for Sharp native libs.
