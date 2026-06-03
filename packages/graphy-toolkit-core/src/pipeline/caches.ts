import { promises as fs } from "node:fs";
import path from "node:path";
import sharp from "sharp";
import { pickAspectBucket } from "../aspectBucket.js";
import { hasExistingCopyright } from "../services/copyrightService.js";
import type { WatermarkOptions } from "../services/watermarkService.js";
import { loadWatermarkSvg } from "../services/watermarkService.js";

export type SourcePrepared = {
  buffer: Buffer;
  width: number;
  height: number;
  hasSourceCopyright: boolean;
  aspectLabel: string;
};

export type WatermarkLayer = {
  png: Buffer;
  wmWidth: number;
  wmHeight: number;
  margin: number;
};

export type RunCaches = {
  watermarkSvg: Map<string, Buffer>;
  watermarkLayer: Map<string, WatermarkLayer>;
  sourceByPath: Map<string, Promise<SourcePrepared>>;
  filePipelineDone: Map<string, number>;
  createdDirs: Set<string>;
  pipelineTotal: number;
};

export async function ensureOutputDir(
  filePath: string,
  caches: RunCaches,
): Promise<void> {
  const dir = path.dirname(filePath);
  if (caches.createdDirs.has(dir)) return;
  await fs.mkdir(dir, { recursive: true });
  caches.createdDirs.add(dir);
}

export function createRunCaches(pipelineTotal: number): RunCaches {
  return {
    watermarkSvg: new Map(),
    watermarkLayer: new Map(),
    sourceByPath: new Map(),
    filePipelineDone: new Map(),
    createdDirs: new Set(),
    pipelineTotal,
  };
}

export function watermarkSvgCacheKey(wmPath: string, opacity: number): string {
  return `${wmPath}\0${opacity}`;
}

export function watermarkLayerCacheKey(
  wmPath: string,
  opacity: number,
  width: number,
  height: number,
  options: WatermarkOptions,
): string {
  return `${wmPath}\0${opacity}\0${width}x${height}\0${options.sizeRatio}\0${options.paddingRatio}`;
}

export async function getCachedWatermarkSvg(
  wmPath: string,
  opacity: number,
  caches: RunCaches,
): Promise<Buffer> {
  const key = watermarkSvgCacheKey(wmPath, opacity);
  let svg = caches.watermarkSvg.get(key);
  if (!svg) {
    svg = await loadWatermarkSvg(wmPath, opacity);
    caches.watermarkSvg.set(key, svg);
  }
  return svg;
}

async function rasterizeWatermarkLayer(
  watermarkSvg: Buffer,
  width: number,
  height: number,
  options: WatermarkOptions,
): Promise<WatermarkLayer> {
  const margin = Math.max(
    12,
    Math.round(Math.min(width, height) * options.paddingRatio),
  );
  const maxWatermarkWidth = Math.max(1, width - margin * 2);
  const maxWatermarkHeight = Math.max(1, height - margin * 2);
  const requestedWidth = Math.max(64, Math.round(width * options.sizeRatio));
  const requestedHeight = Math.max(64, Math.round(height * options.sizeRatio));

  const watermarkPng = await sharp(watermarkSvg)
    .resize({
      width: Math.min(maxWatermarkWidth, requestedWidth),
      height: Math.min(maxWatermarkHeight, requestedHeight),
      fit: "inside",
      withoutEnlargement: false,
    })
    .png()
    .toBuffer();

  const png = await sharp(watermarkPng)
    .resize({
      width: maxWatermarkWidth,
      height: maxWatermarkHeight,
      fit: "inside",
      withoutEnlargement: true,
    })
    .png()
    .toBuffer();

  const wmMeta = await sharp(png).metadata();
  return {
    png,
    wmWidth: wmMeta.width ?? 1,
    wmHeight: wmMeta.height ?? 1,
    margin,
  };
}

export async function getCachedWatermarkLayer(
  wmPath: string,
  opacity: number,
  width: number,
  height: number,
  options: WatermarkOptions,
  caches: RunCaches,
): Promise<WatermarkLayer> {
  const key = watermarkLayerCacheKey(wmPath, opacity, width, height, options);
  let layer = caches.watermarkLayer.get(key);
  if (!layer) {
    const svg = await getCachedWatermarkSvg(wmPath, opacity, caches);
    layer = await rasterizeWatermarkLayer(svg, width, height, options);
    caches.watermarkLayer.set(key, layer);
  }
  return layer;
}

async function loadSourcePrepared(sourcePath: string): Promise<SourcePrepared> {
  const pipeline = sharp(sourcePath).rotate().keepMetadata();
  const meta = await pipeline.metadata();
  const { data, info } = await pipeline.toBuffer({ resolveWithObject: true });
  const width = info.width;
  const height = info.height;
  return {
    buffer: data,
    width,
    height,
    hasSourceCopyright: hasExistingCopyright(meta),
    aspectLabel: pickAspectBucket(width, height).suffix,
  };
}

export async function getOrLoadSource(
  sourcePath: string,
  caches: RunCaches,
): Promise<SourcePrepared> {
  let pending = caches.sourceByPath.get(sourcePath);
  if (!pending) {
    pending = loadSourcePrepared(sourcePath);
    caches.sourceByPath.set(sourcePath, pending);
  }
  return pending;
}

/** Drop decoded source pixels after this file has finished every pipeline. */
export function recordFilePipelineComplete(
  caches: RunCaches,
  sourcePath: string,
): void {
  const done = (caches.filePipelineDone.get(sourcePath) ?? 0) + 1;
  caches.filePipelineDone.set(sourcePath, done);
  if (done >= caches.pipelineTotal) {
    caches.sourceByPath.delete(sourcePath);
    caches.filePipelineDone.delete(sourcePath);
  }
}
