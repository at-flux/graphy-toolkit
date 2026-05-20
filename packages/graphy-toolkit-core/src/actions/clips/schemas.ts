import { z } from 'zod';
import { WatermarkRasterOptionsSchema } from '../stills/schemas.js';

export const ClipsWatermarkInputSchema = z.object({
  sourceRoot: z.string(),
  distRoot: z.string(),
  watermarkPath: z.string(),
  watermark: WatermarkRasterOptionsSchema.optional(),
});

export const ClipsWatermarkOutputSchema = z.object({
  processed: z.number().int().nonnegative(),
  written: z.array(z.string()),
});

export type ClipsWatermarkInput = z.infer<typeof ClipsWatermarkInputSchema>;
export type ClipsWatermarkOutput = z.infer<typeof ClipsWatermarkOutputSchema>;
