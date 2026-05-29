---
name: graphy-toolkit
description: Run graphy stills and clip release pipelines (Sharp + ffmpeg), graphy-release.presets.json, and graphy install. Use when optimizing photos for web delivery, watermarking stills or clips, or setting up the graphy CLI.
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

Auto-loads `graphy-release.presets.json` from cwd when `--presets` is omitted.

## Presets

`graphy-release.presets.json` — `stills.release`, `stills.size`, `stills.watermark`, `clips.watermark`. CLI flags override preset values.

## Requirements

- Node 20+ (Sharp)
- ffmpeg on PATH for `clips watermark`
- Watermark SVG path required (not bundled)

## Portable binary

`pnpm compile:graphy` — Deno `compile --self-extracting` for Sharp native libs.
