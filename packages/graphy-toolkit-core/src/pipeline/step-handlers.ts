import { promises as fs } from "node:fs";
import path from "node:path";
import sharp from "sharp";
import { pickAspectBucket } from "../aspectBucket.js";
import { hasExistingCopyright } from "../services/copyrightService.js";
import {
  readMetadataAfterRotate,
  mergeOutputExif,
} from "../services/exifService.js";
import { ensureParentDir } from "../services/fsService.js";
import { encodeOutput } from "../services/stillService.js";
import {
  compositeWatermark,
  loadWatermarkSvg,
  type WatermarkOptions,
} from "../services/watermarkService.js";
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

export type RunCaches = {
  watermarkSvg: Map<string, Buffer>;
};

function watermarkCacheKey(wmPath: string, opacity: number): string {
  return `${wmPath}\0${opacity}`;
}

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

async function ensureBuffer(ctx: PipelineContext): Promise<void> {
  if (ctx.buffer) return;
  const pipeline = sharp(ctx.sourcePath).rotate().keepMetadata();
  const { data, info } = await pipeline.toBuffer({ resolveWithObject: true });
  ctx.buffer = data;
  ctx.width = info.width;
  ctx.height = info.height;
}

async function applyResize(
  ctx: PipelineContext,
  step: ResizeStep,
): Promise<void> {
  await ensureBuffer(ctx);
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
  await ensureBuffer(ctx);
  const wmPath = path.resolve(cwd, step.watermark);
  const cacheKey = watermarkCacheKey(wmPath, step.opacity);
  let svg = caches.watermarkSvg.get(cacheKey);
  if (!svg) {
    svg = await loadWatermarkSvg(wmPath, step.opacity);
    caches.watermarkSvg.set(cacheKey, svg);
  }
  const opts: WatermarkOptions = {
    opacity: step.opacity,
    sizeRatio: step.sizeRatio,
    paddingRatio: step.paddingRatio,
  };
  let pipeline = sharp(ctx.buffer!);
  pipeline = await compositeWatermark(
    pipeline,
    svg,
    ctx.width,
    ctx.height,
    opts,
  );
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
): Promise<string> {
  await ensureBuffer(ctx);
  ctx.jpegQuality = step.jpegQuality;
  const outPath = buildStagingPath(ctx);
  await ensureParentDir(outPath);

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

async function renameWritten(ctx: PipelineContext): Promise<void> {
  if (!ctx.writtenPath) return;
  const nextPath = buildOutputPath(ctx);
  if (nextPath === ctx.writtenPath) return;
  await ensureParentDir(nextPath);
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
      await applyResize(ctx, step);
      return undefined;
    case "watermark":
      await applyWatermark(ctx, step, cwd, caches);
      return undefined;
    case "filename":
      applyFilename(ctx, step);
      if (ctx.writtenPath) await renameWritten(ctx);
      return undefined;
    case "copyright":
      applyCopyright(ctx, step);
      return undefined;
    case "encoding":
      return applyEncoding(ctx, step);
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
): Promise<PipelineContext> {
  const meta = await readMetadataAfterRotate(sourcePath);
  const w = meta.width ?? 0;
  const h = meta.height ?? 0;
  return {
    sourcePath,
    sourceRoot,
    distRoot,
    buffer: null,
    width: w,
    height: h,
    aspectLabel: pickAspectBucket(w, h).suffix,
    suffix: "",
    branchKey: "",
    copyright: "",
    hasSourceCopyright: hasExistingCopyright(meta),
    writtenPath: null,
    outputExt: path.extname(sourcePath) || ".JPG",
    jpegQuality: 84,
  };
}
