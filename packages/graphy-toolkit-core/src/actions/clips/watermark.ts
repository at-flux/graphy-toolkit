import { promises as fs } from 'node:fs';
import path from 'node:path';
import { buildMirroredOutputPath, walkFiles } from '../../services/fsService.js';
import { overlayWatermarkOnClip, VIDEO_REGEX } from '../../services/clipService.js';
import { WatermarkRasterOptionsSchema } from '../stills/schemas.js';
import { defineAction } from '../chain.js';
import { ClipsWatermarkInputSchema, ClipsWatermarkOutputSchema } from './schemas.js';

export const clipsWatermarkAction = defineAction({
  name: 'clips/watermark',
  inputSchema: ClipsWatermarkInputSchema,
  outputSchema: ClipsWatermarkOutputSchema,
  async run(input) {
    await fs.access(input.sourceRoot);
    await fs.access(input.watermarkPath);
    await fs.mkdir(input.distRoot, { recursive: true });

    const watermark = WatermarkRasterOptionsSchema.parse(input.watermark ?? {});
    const files = (await walkFiles(input.sourceRoot)).filter((f) => VIDEO_REGEX.test(f));
    const written: string[] = [];

    for (const sourceFilePath of files) {
      const outputFilePath = buildMirroredOutputPath(
        sourceFilePath,
        input.sourceRoot,
        input.distRoot,
        'wm',
        true,
      );
      const ext = path.extname(outputFilePath);
      const outPath =
        ext.toLowerCase() === '.mp4'
          ? outputFilePath
          : outputFilePath.replace(/\.[^.]+$/, '.mp4');

      await overlayWatermarkOnClip({
        sourceFilePath,
        outputFilePath: outPath,
        watermarkPngPath: input.watermarkPath,
        opacity: watermark.opacity,
      });
      written.push(outPath);
    }

    return { processed: files.length, written };
  },
});
