import path from 'node:path';
import {
  findDefaultPresetsFile,
  loadPresetsFile,
  mergePreset,
  resolveSourceSpec,
  type GraphyPresets,
  type ResolvedSource,
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

export type ResolvedIO = {
  source: ResolvedSource;
  distRoot: string;
  copyright: string;
  watermarkMode: WatermarkMode;
  presets?: GraphyPresets;
  presetsPath?: string;
};

export type ResolvedRelease = ResolvedIO & {
  watermarkPath: string;
};

async function loadPresets(flags: CommonFlags, cwd: string): Promise<{
  presets?: GraphyPresets;
  presetsPath?: string;
}> {
  const presetsPath =
    flags.presets != null
      ? path.resolve(cwd, flags.presets)
      : await findDefaultPresetsFile(cwd);
  if (!presetsPath) return {};
  return { presets: await loadPresetsFile(presetsPath), presetsPath };
}

function mergeReleasePresets(
  presets: GraphyPresets | undefined,
  presetKey: 'release' | 'watermark' | 'size',
  domain: 'stills' | 'clips',
): Record<string, unknown> | undefined {
  const stillsPresets = presets?.stills;
  const clipsPresets = presets?.clips;
  if (domain === 'stills' && presetKey === 'release') return stillsPresets?.release;
  if (domain === 'stills' && presetKey === 'size') return stillsPresets?.size;
  if (domain === 'stills' && presetKey === 'watermark') return stillsPresets?.watermark;
  if (domain === 'clips' && presetKey === 'watermark') return clipsPresets?.watermark;
  return undefined;
}

/** Resolve source, dist, and presets (watermark not required). */
export async function resolveIO(
  flags: CommonFlags,
  cwd: string,
  presetKey: 'release' | 'watermark' | 'size',
  domain: 'stills' | 'clips',
): Promise<ResolvedIO> {
  const { presets, presetsPath } = await loadPresets(flags, cwd);
  const actionPresets = mergeReleasePresets(presets, presetKey, domain);

  const merged = mergePreset(actionPresets, {
    sourceRoot: flags.source,
    distRoot: flags.dist,
    copyright: flags.copyright,
    watermarkMode: flags.watermarkMode,
  });

  const sourceSpec = String(merged.sourceRoot ?? flags.source ?? './images');
  const source = await resolveSourceSpec(sourceSpec, cwd);
  const distRoot = path.resolve(cwd, String(merged.distRoot ?? flags.dist ?? './dist'));

  return {
    source,
    distRoot,
    copyright: String(merged.copyright ?? flags.copyright ?? ''),
    watermarkMode:
      (merged.watermarkMode as WatermarkMode | undefined) ??
      flags.watermarkMode ??
      'marked-only',
    presets,
    presetsPath,
  };
}

/** Resolve paths for commands that require a watermark asset. */
export async function resolveRelease(
  flags: CommonFlags,
  cwd: string,
  presetKey: 'release' | 'watermark' | 'size',
  domain: 'stills' | 'clips',
): Promise<ResolvedRelease> {
  const io = await resolveIO(flags, cwd, presetKey, domain);
  const actionPresets = mergeReleasePresets(io.presets, presetKey, domain);
  const merged = mergePreset(actionPresets, {
    watermark: flags.watermark,
  });

  const watermarkPath = merged.watermark
    ? path.resolve(cwd, String(merged.watermark))
    : flags.watermark
      ? path.resolve(cwd, flags.watermark)
      : '';

  if (!watermarkPath) {
    throw new Error(
      'Watermark required: pass --watermark <file.svg> or set stills.release.watermark in graphy-release.presets.json',
    );
  }

  return { ...io, watermarkPath };
}
