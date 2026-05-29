import { z } from 'zod';
import { WatermarkModeSchema } from '../../schemas/presets.js';

export const EncodeQualitySchema = z.object({
  jpegQuality: z.number().int().default(84),
  pngQuality: z.number().int().default(84),
  webpQuality: z.number().int().default(82),
  avifQuality: z.number().int().default(54),
});

export const StillsSizeInputSchema = z.object({
  sourceRoot: z.string(),
  sourceFiles: z.array(z.string()).optional(),
  distRoot: z.string(),
  encode: EncodeQualitySchema.optional(),
});

export const SizedRasterSchema = z.object({
  buffer: z.instanceof(Buffer),
  width: z.number().int().positive(),
  height: z.number().int().positive(),
  suffix: z.string(),
});

export const SizedStillItemSchema = z.object({
  sourceFilePath: z.string(),
  main: SizedRasterSchema,
  thumb1x1: SizedRasterSchema,
  thumb3x1: SizedRasterSchema,
  hasCopyright: z.boolean(),
});

export const StillsSizeOutputSchema = z.object({
  sourceRoot: z.string(),
  distRoot: z.string(),
  encode: EncodeQualitySchema,
  items: z.array(SizedStillItemSchema),
});

export const WatermarkRasterOptionsSchema = z.object({
  opacity: z.number().min(0).max(1).default(0.22),
  sizeRatio: z.number().positive().default(0.1),
  paddingRatio: z.number().min(0).default(0.02),
});

export const StillsWatermarkInputSchema = z.object({
  sourceRoot: z.string(),
  distRoot: z.string(),
  watermarkPath: z.string(),
  watermarkMode: WatermarkModeSchema.default('marked-only'),
  copyright: z.string().default(''),
  encode: EncodeQualitySchema,
  watermark: WatermarkRasterOptionsSchema,
  items: z.array(SizedStillItemSchema),
});

export const StillsWatermarkOutputSchema = z.object({
  processed: z.number().int().nonnegative(),
  written: z.array(z.string()),
});

export const StillsReleaseInputSchema = z.object({
  sourceRoot: z.string(),
  sourceFiles: z.array(z.string()).optional(),
  distRoot: z.string(),
  watermarkPath: z.string(),
  watermarkMode: WatermarkModeSchema.default('marked-only'),
  copyright: z.string().default(''),
  encode: EncodeQualitySchema.optional(),
  watermark: WatermarkRasterOptionsSchema.optional(),
});

export const StillsReleaseOutputSchema = StillsWatermarkOutputSchema;

export type StillsSizeInput = z.infer<typeof StillsSizeInputSchema>;
export type StillsSizeOutput = z.infer<typeof StillsSizeOutputSchema>;
export type StillsWatermarkInput = z.infer<typeof StillsWatermarkInputSchema>;
export type StillsWatermarkOutput = z.infer<typeof StillsWatermarkOutputSchema>;
export type StillsReleaseInput = z.infer<typeof StillsReleaseInputSchema>;
export type StillsReleaseOutput = z.infer<typeof StillsReleaseOutputSchema>;
