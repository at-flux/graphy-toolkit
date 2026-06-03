import { promises as fs } from "node:fs";
import path from "node:path";
import sharp from "sharp";
import { pickAspectBucket } from "../aspectBucket.js";
import {
  ensureOutputDir,
  getCachedWatermarkLayer,
  getOrLoadSource,
  type RunCaches,
} from "./caches.js";
import { mergeOutputExif } from "../services/exifService.js";
import { encodeOutput } from "../services/stillService.js";
import type {
  CopyrightStep,
  EncodingStep,
  FilenameStep,
  ResizeStep,
  Step,
  WatermarkStep,
} from "../schemas/steps.js";
import type { PipelineContext } from "./context.js";
import { buildOutputPath, buildStagingPath } from "./context.js";

export type { RunCaches } from "./caches.js";

function resizeAspectLabel(width: number, height: number): string {
  const gcd = (a: number, b: number): number => (b === 0 ? a : gcd(b, a % b));
  const g = gcd(width, height);
  return `${width / g}x${height / g}`;
}

function resolveSuffixToken(suffix: string, ctx: PipelineContext): string {
  return suffix.replaceAll("{aspect_ratio}", ctx.aspectLabel);
}

function appendSuffix(ctx: PipelineContext, part: string): void {
  const resolved = resolveSuffixToken(part, ctx);
  if (!resolved) return;
  if (resolved.startsWith("-")) {
    ctx.suffix += resolved;
  } else {
    ctx.suffix += `-${resolved}`;
  }
}

async function ensureBuffer(
  ctx: PipelineContext,
  caches: RunCaches,
): Promise<void> {
  if (ctx.buffer) return;
  const source = await getOrLoadSource(ctx.sourcePath, caches);
  ctx.buffer = Buffer.from(source.buffer);
  ctx.width = source.width;
  ctx.height = source.height;
}

async function applyResize(
  ctx: PipelineContext,
  step: ResizeStep,
  caches: RunCaches,
): Promise<void> {
  await ensureBuffer(ctx, caches);
  const fit = step.scale === "crop" ? "cover" : "inside";
  let targetW = step.width;
  let targetH = step.height;

  if (step.scale === "crop") {
    if (step.width === step.height) {
      const edge = Math.min(step.width, step.height, ctx.width, ctx.height);
      targetW = edge;
      targetH = edge;
    } else if (step.width / step.height === 3) {
      targetW = ctx.width;
      targetH = Math.max(1, Math.round(ctx.width / 3));
    }
  }

  const pipeline = sharp(ctx.buffer!)
    .resize({
      width: targetW,
      height: targetH,
      fit,
      position: step.align,
      withoutEnlargement: true,
    })
    .keepMetadata();
  const { data, info } = await pipeline.toBuffer({ resolveWithObject: true });
  ctx.buffer = data;
  ctx.width = info.width;
  ctx.height = info.height;
  ctx.aspectLabel =
    step.scale === "crop"
      ? resizeAspectLabel(step.width, step.height)
      : pickAspectBucket(step.width, step.height).suffix;
  if (step.suffix) appendSuffix(ctx, step.suffix);
}

async function applyWatermark(
  ctx: PipelineContext,
  step: WatermarkStep,
  cwd: string,
  caches: RunCaches,
): Promise<void> {
  await ensureBuffer(ctx, caches);
  const wmPath = path.resolve(cwd, step.watermark);
  const opts = {
    opacity: step.opacity,
    sizeRatio: step.sizeRatio,
    paddingRatio: step.paddingRatio,
  };
  const layer = await getCachedWatermarkLayer(
    wmPath,
    step.opacity,
    ctx.width,
    ctx.height,
    opts,
    caches,
  );
  let pipeline = sharp(ctx.buffer!);
  pipeline = pipeline.composite([
    {
      input: layer.png,
      left: Math.max(0, ctx.width - layer.wmWidth - layer.margin),
      top: Math.max(0, ctx.height - layer.wmHeight - layer.margin),
    },
  ]);
  const { data, info } = await pipeline.toBuffer({ resolveWithObject: true });
  ctx.buffer = data;
  ctx.width = info.width;
  ctx.height = info.height;
}

function applyFilename(ctx: PipelineContext, step: FilenameStep): void {
  appendSuffix(ctx, step.suffix);
}

function applyCopyright(ctx: PipelineContext, step: CopyrightStep): void {
  ctx.copyright = step.copyright;
}

async function applyEncoding(
  ctx: PipelineContext,
  step: EncodingStep,
  caches: RunCaches,
): Promise<string> {
  await ensureBuffer(ctx, caches);
  ctx.jpegQuality = step.jpegQuality;
  const outPath = buildStagingPath(ctx);
  await ensureOutputDir(outPath, caches);

  let pipeline = sharp(ctx.buffer!);
  pipeline = mergeOutputExif(
    pipeline,
    ctx.width,
    ctx.height,
    ctx.hasSourceCopyright,
    ctx.copyright,
  );
  await encodeOutput(pipeline, outPath, {
    jpegQuality: step.jpegQuality,
    pngQuality: step.jpegQuality,
    webpQuality: step.jpegQuality,
    avifQuality: step.jpegQuality,
  }).toFile(outPath);

  ctx.writtenPath = outPath;
  ctx.buffer = null;
  return outPath;
}

async function renameWritten(
  ctx: PipelineContext,
  caches: RunCaches,
): Promise<void> {
  if (!ctx.writtenPath) return;
  const nextPath = buildOutputPath(ctx);
  if (nextPath === ctx.writtenPath) return;
  await ensureOutputDir(nextPath, caches);
  await fs.rename(ctx.writtenPath, nextPath);
  ctx.writtenPath = nextPath;
}

export async function executeStep(
  _stepName: string,
  step: Step,
  ctx: PipelineContext,
  cwd: string,
  caches: RunCaches,
): Promise<string | undefined> {
  switch (step.type) {
    case "resize":
      await applyResize(ctx, step, caches);
      return undefined;
    case "watermark":
      await applyWatermark(ctx, step, cwd, caches);
      return undefined;
    case "filename":
      applyFilename(ctx, step);
      if (ctx.writtenPath) await renameWritten(ctx, caches);
      return undefined;
    case "copyright":
      applyCopyright(ctx, step);
      return undefined;
    case "encoding":
      return applyEncoding(ctx, step, caches);
    default: {
      const _exhaustive: never = step;
      throw new Error(
        `Unsupported step type for stills: ${(_exhaustive as Step).type}`,
      );
    }
  }
}

export async function createStillsContext(
  sourcePath: string,
  sourceRoot: string,
  distRoot: string,
  caches: RunCaches,
): Promise<PipelineContext> {
  const source = await getOrLoadSource(sourcePath, caches);
  return {
    sourcePath,
    sourceRoot,
    distRoot,
    buffer: Buffer.from(source.buffer),
    width: source.width,
    height: source.height,
    aspectLabel: source.aspectLabel,
    suffix: "",
    branchKey: "",
    copyright: "",
    hasSourceCopyright: source.hasSourceCopyright,
    writtenPath: null,
    outputExt: path.extname(sourcePath) || ".JPG",
    jpegQuality: 84,
  };
}
