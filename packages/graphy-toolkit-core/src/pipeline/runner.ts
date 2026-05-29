import os from 'node:os';
import type { MediaSection } from '../schemas/presets.js';
import {
  DEFAULT_ENCODING_STEP,
  type Pipeline,
  type Step,
  type StepRef,
} from '../schemas/steps.js';
import { cloneContext, type PipelineContext } from './context.js';
import { executeClipWatermarkStep, createClipContext } from './clip-handlers.js';
import { createStillsContext, executeStep } from './step-handlers.js';

export type ProgressCallback = (event: {
  phase: 'file' | 'pipeline' | 'file-done' | 'done';
  index?: number;
  total?: number;
  completed?: number;
  file?: string;
  pipeline?: string;
  message?: string;
}) => void;

export type RunMediaOptions = {
  cwd: string;
  sourceFiles: string[];
  sourceRoot: string;
  distRoot: string;
  section: MediaSection;
  failFast?: boolean;
  concurrency?: number;
  onProgress?: ProgressCallback;
};

export type RunMediaResult = {
  processed: number;
  written: string[];
  errors: { file: string; pipeline?: string; error: Error }[];
};

function resolveStep(name: string, steps: Record<string, Step>): Step {
  if (steps[name]) return steps[name];
  if (name === 'encoding') return DEFAULT_ENCODING_STEP;
  throw new Error(`Unknown step "${name}" — add it to steps in graphy-release.presets.json`);
}

async function runStepRef(
  ref: StepRef,
  branches: PipelineContext[],
  steps: Record<string, Step>,
  cwd: string,
): Promise<PipelineContext[]> {
  if (Array.isArray(ref)) {
    const next: PipelineContext[] = [];
    await Promise.all(
      branches.map(async (branch) => {
        await Promise.all(
          ref.map(async (stepName) => {
            const fork = cloneContext(branch);
            fork.branchKey = stepName;
            const step = resolveStep(stepName, steps);
            await executeStep(stepName, step, fork, cwd);
            next.push(fork);
          }),
        );
      }),
    );
    return next;
  }

  const step = resolveStep(ref, steps);
  await Promise.all(branches.map((branch) => executeStep(ref, step, branch, cwd)));
  return branches;
}

async function runStillsPipeline(
  pipeline: Pipeline,
  file: string,
  opts: RunMediaOptions,
): Promise<string[]> {
  const { section, cwd, sourceRoot, distRoot } = opts;
  let branches: PipelineContext[] = [await createStillsContext(file, sourceRoot, distRoot)];
  const written: string[] = [];

  for (const ref of pipeline.steps) {
    branches = await runStepRef(ref, branches, section.steps, cwd);
  }

  for (const branch of branches) {
    if (branch.writtenPath) written.push(branch.writtenPath);
  }

  return [...new Set(written)];
}

async function runClipPipeline(
  pipeline: Pipeline,
  file: string,
  opts: RunMediaOptions,
): Promise<string[]> {
  const { section, cwd, sourceRoot, distRoot } = opts;
  const ctx = createClipContext(file, sourceRoot, distRoot);
  const written: string[] = [];

  for (const ref of pipeline.steps) {
    const names = Array.isArray(ref) ? ref : [ref];
    for (const stepName of names) {
      const step = resolveStep(stepName, section.steps);
      if (step.type !== 'watermark') {
        throw new Error(`Clips pipeline only supports watermark steps (got ${step.type})`);
      }
      const out = await executeClipWatermarkStep(ctx, step, cwd);
      written.push(out);
    }
  }

  return written;
}

async function runFile(
  file: string,
  fileIndex: number,
  totalFiles: number,
  opts: RunMediaOptions,
  mode: 'stills' | 'clips',
): Promise<{ written: string[]; errors: RunMediaResult['errors'] }> {
  const written: string[] = [];
  const errors: RunMediaResult['errors'] = [];

  for (const pipeline of opts.section.pipelines) {
    opts.onProgress?.({
      phase: 'pipeline',
      index: fileIndex + 1,
      total: totalFiles,
      file,
      pipeline: pipeline.name,
    });
    try {
      const outs =
        mode === 'stills'
          ? await runStillsPipeline(pipeline, file, opts)
          : await runClipPipeline(pipeline, file, opts);
      written.push(...outs);
    } catch (error) {
      const err = error instanceof Error ? error : new Error(String(error));
      errors.push({ file, pipeline: pipeline.name, error: err });
      if (opts.failFast) throw err;
    }
  }

  return { written, errors };
}

export async function runMediaPipeline(
  opts: RunMediaOptions,
  mode: 'stills' | 'clips',
): Promise<RunMediaResult> {
  const concurrency = opts.concurrency ?? Math.max(2, Math.min(8, os.cpus().length));
  const files = opts.sourceFiles;
  const allWritten: string[] = [];
  const allErrors: RunMediaResult['errors'] = [];
  let nextIndex = 0;
  let completedCount = 0;

  async function worker(): Promise<void> {
    for (;;) {
      const i = nextIndex++;
      if (i >= files.length) return;
      const file = files[i]!;
      opts.onProgress?.({ phase: 'file', index: i + 1, total: files.length, file });
      try {
        const { written, errors } = await runFile(file, i, files.length, opts, mode);
        allWritten.push(...written);
        allErrors.push(...errors);
        completedCount++;
        opts.onProgress?.({
          phase: 'file-done',
          index: i + 1,
          total: files.length,
          completed: completedCount,
          file,
        });
        if (opts.failFast && errors.length > 0) {
          throw errors[0]!.error;
        }
      } catch (error) {
        const err = error instanceof Error ? error : new Error(String(error));
        allErrors.push({ file, error: err });
        completedCount++;
        opts.onProgress?.({
          phase: 'file-done',
          index: i + 1,
          total: files.length,
          completed: completedCount,
          file,
        });
        if (opts.failFast) throw err;
      }
    }
  }

  await Promise.all(Array.from({ length: concurrency }, () => worker()));

  opts.onProgress?.({ phase: 'done', message: 'complete' });

  return {
    processed: files.length,
    written: [...new Set(allWritten)],
    errors: allErrors,
  };
}
