import sharp from 'sharp';
import { mergeOutputExif } from '../../services/exifService.js';
import { buildMirroredOutputPath, ensureParentDir } from '../../services/fsService.js';
import {
  compositeWatermark,
  loadWatermarkSvg,
} from '../../services/watermarkService.js';
import { encodeOutput } from '../../services/stillService.js';
import { defineAction } from '../chain.js';
import {
  EncodeQualitySchema,
  StillsWatermarkInputSchema,
  StillsWatermarkOutputSchema,
  WatermarkRasterOptionsSchema,
} from './schemas.js';

export const stillsWatermarkAction = defineAction({
  name: 'stills/watermark',
  inputSchema: StillsWatermarkInputSchema,
  outputSchema: StillsWatermarkOutputSchema,
  async run(input) {
    const wm = WatermarkRasterOptionsSchema.parse(input.watermark);
    const encode = EncodeQualitySchema.parse(input.encode);
    const watermarkSvg = await loadWatermarkSvg(input.watermarkPath, wm.opacity);
    const markedModes: boolean[] =
      input.watermarkMode === 'unmarked-only' ? [false] : [true];

    const written: string[] = [];

    for (const item of input.items) {
      const variants = [
        { raster: item.main, suffix: item.main.suffix },
        { raster: item.thumb1x1, suffix: 'thumb-1x1' },
        { raster: item.thumb3x1, suffix: 'thumb-3x1' },
      ] as const;

      for (const marked of markedModes) {
        for (const variant of variants) {
          const outputPath = buildMirroredOutputPath(
            item.sourceFilePath,
            input.sourceRoot,
            input.distRoot,
            variant.suffix,
            marked,
          );
          await ensureParentDir(outputPath);

          let pipeline = sharp(variant.raster.buffer);
          if (marked) {
            pipeline = await compositeWatermark(
              pipeline,
              watermarkSvg,
              variant.raster.width,
              variant.raster.height,
              wm,
            );
          }
          pipeline = mergeOutputExif(
            pipeline,
            variant.raster.width,
            variant.raster.height,
            item.hasCopyright,
            input.copyright ?? '',
          );
          await encodeOutput(pipeline, outputPath, encode).toFile(outputPath);
          written.push(outputPath);
        }
      }
    }

    return { processed: input.items.length, written: [...new Set(written)] };
  },
});
