import os from "node:os";
import type { MediaSection } from "../schemas/presets.js";
import {
  DEFAULT_ENCODING_STEP,
  type Pipeline,
  type Step,
  type StepRef,
} from "../schemas/steps.js";
import {
  createRunCaches,
  recordFilePipelineComplete,
  type RunCaches,
} from "./caches.js";
import { cloneContext, type PipelineContext } from "./context.js";
import {
  executeClipWatermarkStep,
  createClipContext,
} from "./clip-handlers.js";
import { createStillsContext, executeStep } from "./step-handlers.js";

export type ProgressCallback = (event: {
  phase:
    | "file"
    | "pipeline"
    | "pipeline-batch"
    | "pipeline-done"
    | "file-done"
    | "done";
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
  /** Max files processed in parallel within each pipeline. */
  concurrency?: number;
  onProgress?: ProgressCallback;
};

export type RunMediaResult = {
  processed: number;
  written: string[];
  errors: { file: string; pipeline?: string; error: Error }[];
};

type FileRunResult = {
  written: string[];
  errors: RunMediaResult["errors"];
};

function resolveStep(name: string, steps: Record<string, Step>): Step {
  if (steps[name]) return steps[name];
  if (name === "encoding") return DEFAULT_ENCODING_STEP;
  throw new Error(
    `Unknown step "${name}" — add it to steps in graphy-release.presets.json`,
  );
}

function defaultConcurrency(opts: RunMediaOptions): number {
  return opts.concurrency ?? Math.max(2, Math.min(8, os.cpus().length));
}

async function runStepRef(
  ref: StepRef,
  branches: PipelineContext[],
  steps: Record<string, Step>,
  cwd: string,
  caches: RunCaches,
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
            await executeStep(stepName, step, fork, cwd, caches);
            next.push(fork);
          }),
        );
      }),
    );
    return next;
  }

  const step = resolveStep(ref, steps);
  await Promise.all(
    branches.map((branch) => executeStep(ref, step, branch, cwd, caches)),
  );
  return branches;
}

async function runStillsPipeline(
  pipeline: Pipeline,
  file: string,
  opts: RunMediaOptions,
  caches: RunCaches,
): Promise<string[]> {
  const { section, cwd, sourceRoot, distRoot } = opts;
  let branches: PipelineContext[] = [
    await createStillsContext(file, sourceRoot, distRoot, caches),
  ];
  const written: string[] = [];

  for (const ref of pipeline.steps) {
    branches = await runStepRef(ref, branches, section.steps, cwd, caches);
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
  caches: RunCaches,
): Promise<string[]> {
  const { section, cwd, sourceRoot, distRoot } = opts;
  const ctx = createClipContext(file, sourceRoot, distRoot);
  const written: string[] = [];

  for (const ref of pipeline.steps) {
    const names = Array.isArray(ref) ? ref : [ref];
    for (const stepName of names) {
      const step = resolveStep(stepName, section.steps);
      if (step.type !== "watermark") {
        throw new Error(
          `Clips pipeline only supports watermark steps (got ${step.type})`,
        );
      }
      const out = await executeClipWatermarkStep(ctx, step, cwd, caches);
      written.push(out);
    }
  }

  return written;
}

async function runOneFileOnePipeline(
  pipeline: Pipeline,
  file: string,
  fileIndex: number,
  totalFiles: number,
  opts: RunMediaOptions,
  mode: "stills" | "clips",
  caches: RunCaches,
): Promise<FileRunResult> {
  opts.onProgress?.({
    phase: "pipeline",
    index: fileIndex + 1,
    total: totalFiles,
    file,
    pipeline: pipeline.name,
  });

  try {
    const outs =
      mode === "stills"
        ? await runStillsPipeline(pipeline, file, opts, caches)
        : await runClipPipeline(pipeline, file, opts, caches);
    return { written: outs, errors: [] };
  } catch (error) {
    const err = error instanceof Error ? error : new Error(String(error));
    const errors: RunMediaResult["errors"] = [
      { file, pipeline: pipeline.name, error: err },
    ];
    if (opts.failFast) throw err;
    return { written: [], errors };
  } finally {
    opts.onProgress?.({
      phase: "pipeline-done",
      index: fileIndex + 1,
      total: totalFiles,
      file,
      pipeline: pipeline.name,
    });
    recordFilePipelineComplete(caches, file);
  }
}

async function runFilesConcurrently(
  files: string[],
  concurrency: number,
  opts: RunMediaOptions,
  work: (file: string, index: number) => Promise<FileRunResult>,
): Promise<{ allWritten: string[]; allErrors: RunMediaResult["errors"] }> {
  const allWritten: string[] = [];
  const allErrors: RunMediaResult["errors"] = [];
  let nextIndex = 0;
  let completedCount = 0;

  async function worker(): Promise<void> {
    for (;;) {
      const i = nextIndex++;
      if (i >= files.length) return;
      const file = files[i]!;
      opts.onProgress?.({
        phase: "file",
        index: i + 1,
        total: files.length,
        file,
      });
      try {
        const { written, errors } = await work(file, i);
        allWritten.push(...written);
        allErrors.push(...errors);
        completedCount++;
        opts.onProgress?.({
          phase: "file-done",
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
          phase: "file-done",
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

  return { allWritten, allErrors };
}

export async function runMediaPipeline(
  opts: RunMediaOptions,
  mode: "stills" | "clips",
): Promise<RunMediaResult> {
  const concurrency = defaultConcurrency(opts);
  const files = opts.sourceFiles;
  const caches = createRunCaches(opts.section.pipelines.length);
  const allWritten: string[] = [];
  const allErrors: RunMediaResult["errors"] = [];

  for (const pipeline of opts.section.pipelines) {
    opts.onProgress?.({
      phase: "pipeline-batch",
      pipeline: pipeline.name,
      total: files.length,
    });

    const { allWritten: batchWritten, allErrors: batchErrors } =
      await runFilesConcurrently(files, concurrency, opts, (file, index) =>
        runOneFileOnePipeline(
          pipeline,
          file,
          index,
          files.length,
          opts,
          mode,
          caches,
        ),
      );

    allWritten.push(...batchWritten);
    allErrors.push(...batchErrors);
    if (opts.failFast && batchErrors.length > 0) {
      throw batchErrors[0]!.error;
    }
  }

  opts.onProgress?.({ phase: "done", message: "complete" });

  return {
    processed: files.length,
    written: [...new Set(allWritten)],
    errors: allErrors,
  };
}
