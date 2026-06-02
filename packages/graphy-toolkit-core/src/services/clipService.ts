import { spawn } from "node:child_process";
import { promises as fs } from "node:fs";
import path from "node:path";
import sharp from "sharp";
import { ensureParentDir } from "./fsService.js";
import type { WatermarkOptions } from "./watermarkService.js";

export const VIDEO_REGEX = /\.(mp4|mov|m4v|webm|mkv)$/i;

export async function assertFfmpegOnPath(): Promise<void> {
  await new Promise<void>((resolve, reject) => {
    const proc = spawn("ffmpeg", ["-version"], { stdio: "ignore" });
    proc.on("error", () =>
      reject(
        new Error("ffmpeg not found on PATH (required for clips commands)"),
      ),
    );
    proc.on("close", (code) => {
      if (code === 0) resolve();
      else
        reject(
          new Error(`ffmpeg -version exited with code ${code ?? "unknown"}`),
        );
    });
  });
}

export type ClipWatermarkInput = {
  sourceFilePath: string;
  outputFilePath: string;
  watermarkPngPath: string;
  opacity?: number;
};

/** Rasterize SVG watermark to PNG sized for overlay on the video frame. */
export async function rasterizeWatermarkForVideo(
  watermarkPath: string,
  frameWidth: number,
  frameHeight: number,
  options: WatermarkOptions,
  opacity: number,
): Promise<string> {
  const svgRaw = await fs.readFile(watermarkPath, "utf8");
  const withOpacity = svgRaw.replace("<svg ", `<svg opacity="${opacity}" `);
  const margin = Math.max(
    12,
    Math.round(Math.min(frameWidth, frameHeight) * options.paddingRatio),
  );
  const maxW = Math.max(1, frameWidth - margin * 2);
  const maxH = Math.max(1, frameHeight - margin * 2);
  const requestedW = Math.max(64, Math.round(frameWidth * options.sizeRatio));
  const requestedH = Math.max(64, Math.round(frameHeight * options.sizeRatio));

  const png = await sharp(Buffer.from(withOpacity, "utf8"))
    .resize({
      width: Math.min(maxW, requestedW),
      height: Math.min(maxH, requestedH),
      fit: "inside",
      withoutEnlargement: false,
    })
    .png()
    .toBuffer();

  const outPath = path.join(
    path.dirname(watermarkPath),
    `.graphy-wm-${process.pid}.png`,
  );
  await fs.writeFile(outPath, png);
  return outPath;
}

async function probeVideoSize(
  filePath: string,
): Promise<{ width: number; height: number }> {
  const stdout = await new Promise<string>((resolve, reject) => {
    const proc = spawn(
      "ffprobe",
      [
        "-v",
        "error",
        "-select_streams",
        "v:0",
        "-show_entries",
        "stream=width,height",
        "-of",
        "csv=p=0:s=x",
        filePath,
      ],
      { stdio: ["ignore", "pipe", "pipe"] },
    );
    let out = "";
    proc.stdout?.on("data", (c) => {
      out += String(c);
    });
    proc.on("error", reject);
    proc.on("close", (code) => {
      if (code === 0) resolve(out.trim());
      else reject(new Error(`ffprobe failed for ${filePath}`));
    });
  });
  const [w, h] = stdout.split("x").map((n) => Number.parseInt(n, 10));
  return { width: w || 1920, height: h || 1080 };
}

export async function overlayWatermarkOnClip(
  input: ClipWatermarkInput,
): Promise<void> {
  await assertFfmpegOnPath();
  await ensureParentDir(input.outputFilePath);

  const { width, height } = await probeVideoSize(input.sourceFilePath);
  const wmOpts: WatermarkOptions = {
    opacity: input.opacity ?? 0.22,
    sizeRatio: 0.1,
    paddingRatio: 0.02,
  };
  const wmPng = input.watermarkPngPath.toLowerCase().endsWith(".png")
    ? input.watermarkPngPath
    : await rasterizeWatermarkForVideo(
        input.watermarkPngPath,
        width,
        height,
        wmOpts,
        input.opacity ?? 0.22,
      );

  const margin = Math.max(12, Math.round(Math.min(width, height) * 0.02));
  const filter = `[1:v]format=rgba[wm];[0:v][wm]overlay=W-w-${margin}:H-h-${margin}`;

  await new Promise<void>((resolve, reject) => {
    const proc = spawn(
      "ffmpeg",
      [
        "-y",
        "-i",
        input.sourceFilePath,
        "-i",
        wmPng,
        "-filter_complex",
        filter,
        "-c:a",
        "copy",
        "-c:v",
        "libx264",
        "-preset",
        "medium",
        "-crf",
        "20",
        input.outputFilePath,
      ],
      { stdio: "inherit" },
    );
    proc.on("error", reject);
    proc.on("close", (code) => {
      if (code === 0) resolve();
      else reject(new Error(`ffmpeg exited with code ${code ?? "unknown"}`));
    });
  });

  if (wmPng.includes(".graphy-wm-")) {
    await fs.unlink(wmPng).catch(() => undefined);
  }
}
