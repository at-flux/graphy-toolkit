import { defineAction } from '../chain.js';
import { stillsSizeAction } from './size.js';
import { stillsWatermarkAction } from './watermark.js';
import {
  EncodeQualitySchema,
  StillsReleaseInputSchema,
  StillsReleaseOutputSchema,
  WatermarkRasterOptionsSchema,
} from './schemas.js';

export const stillsReleaseAction = defineAction({
  name: 'stills/release',
  inputSchema: StillsReleaseInputSchema,
  outputSchema: StillsReleaseOutputSchema,
  async run(input) {
    const encode = EncodeQualitySchema.parse(input.encode ?? {});
    const watermark = WatermarkRasterOptionsSchema.parse(input.watermark ?? {});

    const sized = await stillsSizeAction.run(
      {
        sourceRoot: input.sourceRoot,
        distRoot: input.distRoot,
        encode,
      },
      {},
    );

    return stillsWatermarkAction.run(
      {
        sourceRoot: sized.sourceRoot,
        distRoot: sized.distRoot,
        watermarkPath: input.watermarkPath,
        watermarkMode: input.watermarkMode,
        copyright: input.copyright,
        encode: sized.encode,
        watermark,
        items: sized.items,
      },
      {},
    );
  },
});
