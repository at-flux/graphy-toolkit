import {
  EncodeQualitySchema,
  stillsReleaseAction,
  stillsSizeAction,
  stillsWatermarkAction,
  WatermarkRasterOptionsSchema,
} from '@at-flux/graphy-toolkit-core';
import { buildCommand } from '@stricli/core';
import type { CommonFlags } from '../config/resolve.js';
import { resolveIO, resolveRelease } from '../config/resolve.js';

function normalizeArgs(args: string[]): string[] {
  if (!args.includes('--no-watermark')) return args;
  const without = args.filter((a) => a !== '--no-watermark');
  return [...without, '--watermark-mode', 'unmarked-only'];
}

type StillsFlags = CommonFlags;

async function runRelease(flags: StillsFlags): Promise<void> {
  const paths = await resolveRelease(flags, process.cwd(), 'release', 'stills');
  const wmPreset = paths.presets?.stills?.watermark;
  const sizePreset = paths.presets?.stills?.size;

  const result = await stillsReleaseAction.run(
    {
      sourceRoot: paths.source.sourceRoot,
      sourceFiles: paths.source.files,
      distRoot: paths.distRoot,
      watermarkPath: paths.watermarkPath,
      watermarkMode: paths.watermarkMode,
      copyright: paths.copyright || sizePreset?.copyright || '',
      encode: EncodeQualitySchema.parse(sizePreset ?? {}),
      watermark: WatermarkRasterOptionsSchema.parse(wmPreset ?? {}),
    },
    {},
  );
  console.log(`done: ${result.processed} still(s), ${result.written.length} file(s) written`);
}

async function runSize(flags: StillsFlags): Promise<void> {
  const paths = await resolveIO(flags, process.cwd(), 'size', 'stills');
  const sizePreset = paths.presets?.stills?.size;
  const result = await stillsSizeAction.run(
    {
      sourceRoot: paths.source.sourceRoot,
      sourceFiles: paths.source.files,
      distRoot: paths.distRoot,
      encode: EncodeQualitySchema.parse(sizePreset ?? {}),
    },
    {},
  );
  console.log(`done: sized ${result.items.length} still(s)`);
}

async function runWatermark(flags: StillsFlags): Promise<void> {
  const paths = await resolveRelease(flags, process.cwd(), 'watermark', 'stills');
  const sizeResult = await stillsSizeAction.run(
    {
      sourceRoot: paths.source.sourceRoot,
      sourceFiles: paths.source.files,
      distRoot: paths.distRoot,
      encode: EncodeQualitySchema.parse(paths.presets?.stills?.size ?? {}),
    },
    {},
  );
  const wmPreset = paths.presets?.stills?.watermark;
  const result = await stillsWatermarkAction.run(
    {
      ...sizeResult,
      watermarkPath: paths.watermarkPath,
      watermarkMode: paths.watermarkMode,
      copyright: paths.copyright || paths.presets?.stills?.size?.copyright || '',
      watermark: WatermarkRasterOptionsSchema.parse(wmPreset ?? {}),
    },
    {},
  );
  console.log(`done: ${result.processed} still(s), ${result.written.length} file(s) written`);
}

const flagParams = {
  source: {
    brief: 'Source directory, file, or glob (e.g. ./images, ./images/*.JPG)',
    kind: 'parsed' as const,
    parse: String,
    optional: true as const,
  },
  dist: {
    brief: 'Output directory (mirrors paths relative to source root)',
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
  copyright: {
    brief: 'Copyright/artist when source EXIF has none',
    kind: 'parsed' as const,
    parse: String,
    optional: true as const,
  },
  watermarkMode: {
    brief: 'marked-only (default) or unmarked-only',
    kind: 'parsed' as const,
    parse: (v: string) => {
      if (v === 'marked-only' || v === 'unmarked-only') return v;
      throw new Error(`Invalid --watermark-mode: ${v}`);
    },
    optional: true as const,
  },
};

export const stillsReleaseCommand = buildCommand({
  func: runRelease,
  parameters: { flags: flagParams, positional: { kind: 'tuple', parameters: [] } },
  docs: { brief: 'Scale stills, build thumbs, watermark, and write outputs' },
});

export const stillsSizeCommand = buildCommand({
  func: runSize,
  parameters: { flags: flagParams, positional: { kind: 'tuple', parameters: [] } },
  docs: { brief: 'Scale stills and build thumb-1x1 / thumb-3x1 (no watermark)' },
});

export const stillsWatermarkCommand = buildCommand({
  func: runWatermark,
  parameters: { flags: flagParams, positional: { kind: 'tuple', parameters: [] } },
  docs: { brief: 'Size, watermark, and write outputs' },
});

export { normalizeArgs };
