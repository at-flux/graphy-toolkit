# @at-flux/graphy-toolkit-core

Composable still and clip processing for [graphy](../graphy-toolkit).

## Services

- `stillService` — Sharp raster pipeline (scale, thumbs, encode)
- `clipService` — ffmpeg watermark overlay (v1)
- `exifService`, `copyrightService`, `watermarkService`
- `aspectRatio`, `aspectBucket`
- `presetService` — `graphy-presets.json`

## Actions

| Action | Description |
|--------|-------------|
| `stills/size` | Orient, bucket, main + thumbs |
| `stills/watermark` | Watermark + EXIF merge + write |
| `stills/release` | Chain size → watermark |
| `clips/watermark` | ffmpeg overlay only |

Each action exposes Zod `inputSchema` / `outputSchema`.
