import { clipsWatermarkAction, WatermarkRasterOptionsSchema } from '@at-flux/graphy-toolkit-core';
import { buildCommand } from '@stricli/core';
import type { CommonFlags } from '../config/resolve.js';
import { resolveRelease } from '../config/resolve.js';

type ClipsFlags = Pick<CommonFlags, 'source' | 'dist' | 'watermark' | 'presets'>;

async function runClipWatermark(flags: ClipsFlags): Promise<void> {
  const paths = await resolveRelease(flags, process.cwd(), 'watermark', 'clips');
  const wmPreset = paths.presets?.clips?.watermark;
  const result = await clipsWatermarkAction.run(
    {
      sourceRoot: paths.source.sourceRoot,
      distRoot: paths.distRoot,
      watermarkPath: paths.watermarkPath,
      watermark: WatermarkRasterOptionsSchema.parse(wmPreset ?? {}),
    },
    {},
  );
  console.log(`done: ${result.processed} clip(s), ${result.written.length} file(s) written`);
}

const flagParams = {
  source: {
    brief: 'Source directory (recursive)',
    kind: 'parsed' as const,
    parse: String,
    optional: true as const,
  },
  dist: {
    brief: 'Output directory',
    kind: 'parsed' as const,
    parse: String,
    optional: true as const,
  },
  watermark: {
    brief: 'Watermark SVG path',
    kind: 'parsed' as const,
    parse: String,
    optional: true as const,
  },
  presets: {
    brief: 'Presets JSON (default: graphy-release.presets.json in cwd)',
    kind: 'parsed' as const,
    parse: String,
    optional: true as const,
  },
};

export const clipsWatermarkCommand = buildCommand({
  func: runClipWatermark,
  parameters: { flags: flagParams, positional: { kind: 'tuple', parameters: [] } },
  docs: { brief: 'Overlay watermark on clips via ffmpeg (v1)' },
});
