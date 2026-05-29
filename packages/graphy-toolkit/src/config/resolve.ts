import { promises as fs } from 'node:fs';
import path from 'node:path';
import {
  collectSettings,
  findDefaultPresetsFile,
  IMAGE_REGEX,
  loadPresetsFile,
  resolveSourceSpec,
  VIDEO_REGEX,
  type GraphyPresets,
  type MediaSection,
  type ResolvedSource,
} from '@at-flux/graphy-toolkit-core';

export type MediaFlags = {
  source?: string;
  dist?: string;
  presets?: string;
  pipeline?: string;
  quiet?: boolean;
  failFast?: boolean;
};

export type ResolvedMedia = {
  cwd: string;
  source: ResolvedSource;
  distRoot: string;
  section: MediaSection;
  presetsPath?: string;
  settings: ReturnType<typeof collectSettings>;
};

async function loadPresets(flags: MediaFlags, cwd: string): Promise<{
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

export async function resolveMedia(
  flags: MediaFlags,
  cwd: string,
  kind: 'stills' | 'clips',
): Promise<ResolvedMedia> {
  const { presets, presetsPath } = await loadPresets(flags, cwd);
  const raw = presets?.[kind];
  if (!raw) {
    throw new Error(
      `Missing "${kind}" section in graphy-release.presets.json (or pass --presets)`,
    );
  }

  let pipelines = raw.pipelines;
  if (flags.pipeline) {
    pipelines = raw.pipelines.filter((p) => p.name === flags.pipeline);
    if (pipelines.length === 0) {
      throw new Error(`Unknown pipeline "${flags.pipeline}" in ${kind} presets`);
    }
  }

  const section: MediaSection = {
    ...raw,
    pipelines,
    sourceRoot: flags.source ?? raw.sourceRoot,
    distRoot: flags.dist ?? raw.distRoot,
  };

  const sourceSpec = section.sourceRoot;
  const fileFilter = kind === 'clips' ? VIDEO_REGEX : IMAGE_REGEX;
  const source = await resolveSourceSpec(sourceSpec, cwd, fileFilter);
  const distRoot = path.resolve(cwd, section.distRoot);

  await fs.mkdir(distRoot, { recursive: true });

  return {
    cwd,
    source,
    distRoot,
    section,
    presetsPath,
    settings: collectSettings(section.pipelines, section.steps),
  };
}
