import path from "node:path";
import { overlayWatermarkOnClip } from "../services/clipService.js";
import type { WatermarkStep } from "../schemas/steps.js";
import { ensureOutputDir, type RunCaches } from "./caches.js";
import { buildOutputPath, type PipelineContext } from "./context.js";

export async function executeClipWatermarkStep(
  ctx: PipelineContext,
  step: WatermarkStep,
  cwd: string,
  caches: RunCaches,
): Promise<string> {
  const wmPath = path.resolve(cwd, step.watermark);
  const outPath = buildOutputPath(ctx);
  await ensureOutputDir(outPath, caches);
  await overlayWatermarkOnClip({
    sourceFilePath: ctx.sourcePath,
    outputFilePath: outPath,
    watermarkPngPath: wmPath,
    opacity: step.opacity,
  });
  ctx.writtenPath = outPath;
  return outPath;
}

export function createClipContext(
  sourcePath: string,
  sourceRoot: string,
  distRoot: string,
): PipelineContext {
  return {
    sourcePath,
    sourceRoot,
    distRoot,
    buffer: null,
    width: 0,
    height: 0,
    aspectLabel: "",
    suffix: "",
    branchKey: "",
    copyright: "",
    hasSourceCopyright: false,
    writtenPath: null,
    outputExt: path.extname(sourcePath) || ".mp4",
    jpegQuality: 84,
  };
}
