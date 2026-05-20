import path from 'node:path';
import {
  loadPresetsFile,
  mergePreset,
  type GraphyPresets,
  type WatermarkMode,
} from '@at-flux/graphy-toolkit-core';

export type CommonFlags = {
  source?: string;
  dist?: string;
  watermark?: string;
  presets?: string;
  copyright?: string;
  watermarkMode?: WatermarkMode;
};

export type ResolvedPaths = {
  sourceRoot: string;
  distRoot: string;
  watermarkPath: string;
  copyright: string;
  watermarkMode: WatermarkMode;
  presets?: GraphyPresets;
};

export async function resolvePaths(
  flags: CommonFlags,
  cwd: string,
  presetKey: 'release' | 'watermark' | 'size',
  domain: 'stills' | 'clips',
): Promise<ResolvedPaths> {
  let presets: GraphyPresets | undefined;
  if (flags.presets) {
    presets = await loadPresetsFile(path.resolve(cwd, flags.presets));
  }

  const stillsPresets = presets?.stills;
  const clipsPresets = presets?.clips;
  const actionPresets =
    domain === 'stills' && presetKey === 'release'
      ? stillsPresets?.release
      : domain === 'stills' && presetKey === 'size'
        ? stillsPresets?.size
        : domain === 'stills' && presetKey === 'watermark'
          ? stillsPresets?.watermark
          : domain === 'clips' && presetKey === 'watermark'
            ? clipsPresets?.watermark
            : undefined;

  const merged = mergePreset(actionPresets as Record<string, string> | undefined, {
    sourceRoot: flags.source,
    distRoot: flags.dist,
    watermark: flags.watermark,
    copyright: flags.copyright,
    watermarkMode: flags.watermarkMode,
  });

  const sourceRoot = path.resolve(cwd, merged.sourceRoot ?? './images');
  const distRoot = path.resolve(cwd, merged.distRoot ?? './dist');
  const watermarkPath = merged.watermark
    ? path.resolve(cwd, merged.watermark)
    : flags.watermark
      ? path.resolve(cwd, flags.watermark)
      : '';

  if (!watermarkPath) {
    throw new Error(
      'Watermark path required: pass --watermark <file.svg> or set stills.release.watermark / clips.watermark in graphy-presets.json',
    );
  }

  return {
    sourceRoot,
    distRoot,
    watermarkPath,
    copyright: merged.copyright ?? flags.copyright ?? '',
    watermarkMode: (merged.watermarkMode as WatermarkMode | undefined) ?? flags.watermarkMode ?? 'marked-only',
    presets,
  };
}
