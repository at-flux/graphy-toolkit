---
name: graphy-toolkit
description: Run graphy stills and clip release pipelines (Sharp + ffmpeg), graphy-presets.json, and graphy install. Use when optimizing photos for web delivery, watermarking stills or clips, or setting up the graphy CLI.
---

# graphy-toolkit

## When to use

- Batch still export with aspect buckets, thumbs, EXIF, optional watermark
- Overlay watermark on video clips (ffmpeg)
- Install the graphy CLI or this skill on the user machine

## CLI

```bash
graphy stills release --source ./images --dist ./dist --watermark ./brand.svg
graphy clips watermark --source ./clips --dist ./dist --watermark ./brand.svg
graphy install
graphy install skill
```

## Presets

`graphy-presets.json` with `stills` and `clips` sections; per-action keys (`release`, `size`, `watermark`). CLI flags override preset values.

## Requirements

- Node 20+ (Sharp)
- ffmpeg on PATH for `clips watermark`
- Watermark SVG path required (not bundled)

## Portable binary

Build with `pnpm compile:graphy` (Docker). Uses Deno `compile --self-extracting` for Sharp native libs.
