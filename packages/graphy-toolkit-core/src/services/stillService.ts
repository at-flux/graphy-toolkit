import sharp from "sharp";
import type { AspectBucket } from "../aspectBucket.js";
import { THUMB_1X1_MAX_EDGE } from "../aspectBucket.js";

export const IMAGE_REGEX = /\.(jpe?g|png|webp|tiff?|avif)$/i;

export const INTERMEDIATE_JPEG_QUALITY = 92;

export type EncodeQualityOptions = {
  jpegQuality: number;
  pngQuality: number;
  webpQuality: number;
  avifQuality: number;
};

export function intermediateJpegOptions(): sharp.JpegOptions {
  return { quality: INTERMEDIATE_JPEG_QUALITY, mozjpeg: true };
}

export function encodeOutput(
  input: sharp.Sharp,
  outputPath: string,
  options: EncodeQualityOptions,
): sharp.Sharp {
  const ext = outputPath.toLowerCase();
  if (ext.endsWith(".png")) {
    return input.png({
      quality: options.pngQuality,
      compressionLevel: 9,
      adaptiveFiltering: true,
    });
  }
  if (ext.endsWith(".webp"))
    return input.webp({ quality: options.webpQuality });
  if (ext.endsWith(".avif"))
    return input.avif({ quality: options.avifQuality });
  if (ext.endsWith(".tif") || ext.endsWith(".tiff")) {
    return input.tiff({ quality: options.jpegQuality, compression: "jpeg" });
  }
  return input.jpeg({ quality: options.jpegQuality, mozjpeg: true });
}

export type ScaledMain = {
  buffer: Buffer;
  width: number;
  height: number;
  suffix: string;
};

export async function renderMainScaled(
  sourceFilePath: string,
  bucket: AspectBucket,
): Promise<ScaledMain> {
  const resized = sharp(sourceFilePath)
    .rotate()
    .resize({
      width: bucket.maxW,
      height: bucket.maxH,
      fit: "inside",
      withoutEnlargement: true,
    })
    .keepMetadata()
    .jpeg(intermediateJpegOptions());

  const { data, info } = await resized.toBuffer({ resolveWithObject: true });
  return {
    buffer: data,
    width: info.width,
    height: info.height,
    suffix: bucket.suffix,
  };
}

export type ScaledThumb = {
  buffer: Buffer;
  width: number;
  height: number;
};

export async function renderThumb1x1(mainBuffer: Buffer): Promise<ScaledThumb> {
  const meta = await sharp(mainBuffer).metadata();
  const mw = meta.width ?? 0;
  const mh = meta.height ?? 0;
  const edge = Math.min(THUMB_1X1_MAX_EDGE, Math.min(mw, mh));
  const pipeline = sharp(mainBuffer)
    .keepMetadata()
    .resize({ width: edge, height: edge, fit: "cover", position: "centre" })
    .jpeg(intermediateJpegOptions());
  const { data, info } = await pipeline.toBuffer({ resolveWithObject: true });
  return { buffer: data, width: info.width, height: info.height };
}

export async function renderThumb3x1(mainBuffer: Buffer): Promise<ScaledThumb> {
  const meta = await sharp(mainBuffer).metadata();
  const mainW = meta.width ?? 0;
  const thumbW = mainW;
  const thumbH = Math.max(1, Math.round(thumbW / 3));
  const pipeline = sharp(mainBuffer)
    .keepMetadata()
    .resize({
      width: thumbW,
      height: thumbH,
      fit: "cover",
      position: "centre",
    })
    .jpeg(intermediateJpegOptions());
  const { data, info } = await pipeline.toBuffer({ resolveWithObject: true });
  return { buffer: data, width: info.width, height: info.height };
}
