import { runMediaPipeline } from '@at-flux/graphy-toolkit-core';
import { resolveMedia, type MediaFlags } from '../config/resolve.js';
import { createProgressHandler } from '../ui/progress.js';
import { finishRun, startRun } from './run.js';

export async function runMediaCommand(
  kind: 'stills' | 'clips',
  flags: MediaFlags,
): Promise<void> {
  const cwd = process.cwd();
  const resolved = await resolveMedia(flags, cwd, kind);
  const quiet = flags.quiet ?? resolved.section.quiet;

  const progress = quiet
    ? undefined
    : createProgressHandler({
        label: kind === 'stills' ? 'Processing stills' : 'Processing clips',
        pipelineNames: resolved.settings.pipelines,
      });

  if (!quiet) startRun(kind, resolved);

  const result = await runMediaPipeline(
    {
      cwd,
      sourceFiles: resolved.source.files,
      sourceRoot: resolved.source.sourceRoot,
      distRoot: resolved.distRoot,
      section: resolved.section,
      failFast: flags.failFast,
      onProgress: progress?.onProgress,
    },
    kind,
  );

  finishRun(result, quiet, resolved.section.quiet, progress?.startedAt);
}
