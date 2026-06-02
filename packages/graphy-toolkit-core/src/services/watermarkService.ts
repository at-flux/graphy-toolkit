import { promises as fs } from "node:fs";
import sharp from "sharp";

export type WatermarkOptions = {
  opacity: number;
  sizeRatio: number;
  paddingRatio: number;
};

export async function loadWatermarkSvg(
  watermarkPath: string,
  opacity: number,
): Promise<Buffer> {
  const svgRaw = await fs.readFile(watermarkPath, "utf8");
  const withOpacity = svgRaw.replace("<svg ", `<svg opacity="${opacity}" `);
  return Buffer.from(withOpacity, "utf8");
}

export async function compositeWatermark(
  resized: sharp.Sharp,
  watermarkSvg: Buffer,
  width: number,
  height: number,
  options: WatermarkOptions,
): Promise<sharp.Sharp> {
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

  const constrainedWatermark = await sharp(watermarkPng)
    .resize({
      width: maxWatermarkWidth,
      height: maxWatermarkHeight,
      fit: "inside",
      withoutEnlargement: true,
    })
    .png()
    .toBuffer();

  const wmMeta = await sharp(constrainedWatermark).metadata();
  const wmWidth = wmMeta.width ?? 1;
  const wmHeight = wmMeta.height ?? 1;

  return resized.composite([
    {
      input: constrainedWatermark,
      left: Math.max(0, width - wmWidth - margin),
      top: Math.max(0, height - wmHeight - margin),
    },
  ]);
}
