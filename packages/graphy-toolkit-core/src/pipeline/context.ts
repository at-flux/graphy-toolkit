import path from "node:path";
import type { Step } from "../schemas/steps.js";

export type PipelineContext = {
  sourcePath: string;
  sourceRoot: string;
  distRoot: string;
  buffer: Buffer | null;
  width: number;
  height: number;
  aspectLabel: string;
  suffix: string;
  branchKey: string;
  copyright: string;
  hasSourceCopyright: boolean;
  writtenPath: string | null;
  outputExt: string;
  jpegQuality: number;
};

export function cloneContext(ctx: PipelineContext): PipelineContext {
  return { ...ctx, buffer: ctx.buffer ? Buffer.from(ctx.buffer) : null };
}

export function resolveOutputBasename(ctx: PipelineContext): string {
  const rel = path.relative(ctx.sourceRoot, ctx.sourcePath);
  const ext = path.extname(rel);
  return path.basename(rel, ext);
}

export function resolveOutputRelativeDir(ctx: PipelineContext): string {
  return path.dirname(path.relative(ctx.sourceRoot, ctx.sourcePath));
}

export function buildStagingPath(ctx: PipelineContext): string {
  const dir = resolveOutputRelativeDir(ctx);
  const base = resolveOutputBasename(ctx);
  const tag = ctx.branchKey ? `-${ctx.branchKey}` : "";
  const name = `.graphy-${base}${tag}${ctx.outputExt}`;
  return dir === "."
    ? path.join(ctx.distRoot, name)
    : path.join(ctx.distRoot, dir, name);
}
export function buildOutputPath(ctx: PipelineContext): string {
  const dir = resolveOutputRelativeDir(ctx);
  const base = resolveOutputBasename(ctx);
  const branch =
    ctx.branchKey && !ctx.suffix.includes(`-${ctx.branchKey}`)
      ? `-${ctx.branchKey}`
      : "";
  const name = `${base}${ctx.suffix}${branch}${ctx.outputExt}`;
  return dir === "."
    ? path.join(ctx.distRoot, name)
    : path.join(ctx.distRoot, dir, name);
}

export type ResolvedSettings = {
  pipelines: string[];
  jpegQuality?: number;
  watermark?: {
    path: string;
    opacity: number;
    sizeRatio: number;
    paddingRatio: number;
  };
  copyright?: string;
};

export function collectSettings(
  pipelines: { name: string; steps: (string | string[])[] }[],
  steps: Record<string, Step>,
): ResolvedSettings {
  const used = new Set<string>();
  for (const pipeline of pipelines) {
    for (const ref of pipeline.steps) {
      if (Array.isArray(ref)) ref.forEach((s) => used.add(s));
      else used.add(ref);
    }
  }

  const settings: ResolvedSettings = {
    pipelines: pipelines.map((p) => p.name),
  };

  for (const name of used) {
    const step = steps[name];
    if (!step) continue;
    if (step.type === "encoding") settings.jpegQuality = step.jpegQuality;
    if (step.type === "watermark") {
      settings.watermark = {
        path: step.watermark,
        opacity: step.opacity,
        sizeRatio: step.sizeRatio,
        paddingRatio: step.paddingRatio,
      };
    }
    if (step.type === "copyright" && step.copyright.trim()) {
      settings.copyright = step.copyright;
    }
  }

  return settings;
}
