import { z } from 'zod';

export const WatermarkModeSchema = z.enum(['marked-only', 'unmarked-only']);

export const StillsWatermarkPresetSchema = z.object({
  opacity: z.number().min(0).max(1).optional(),
  sizeRatio: z.number().positive().optional(),
  paddingRatio: z.number().min(0).optional(),
});

export const StillsSizePresetSchema = z.object({
  jpegQuality: z.number().int().min(1).max(100).optional(),
  pngQuality: z.number().int().min(1).max(100).optional(),
  webpQuality: z.number().int().min(1).max(100).optional(),
  avifQuality: z.number().int().min(1).max(100).optional(),
  copyright: z.string().optional(),
});

export const StillsReleasePresetSchema = z.object({
  sourceRoot: z.string().optional(),
  distRoot: z.string().optional(),
  watermark: z.string().optional(),
  watermarkMode: WatermarkModeSchema.optional(),
});

export const ClipsWatermarkPresetSchema = z.object({
  sourceRoot: z.string().optional(),
  distRoot: z.string().optional(),
  watermark: z.string().optional(),
  opacity: z.number().min(0).max(1).optional(),
  sizeRatio: z.number().positive().optional(),
  paddingRatio: z.number().min(0).optional(),
  position: z.enum(['bottom-right']).optional(),
});

export const GraphyPresetsSchema = z.object({
  stills: z
    .object({
      release: StillsReleasePresetSchema.optional(),
      watermark: StillsWatermarkPresetSchema.optional(),
      size: StillsSizePresetSchema.optional(),
    })
    .optional(),
  clips: z
    .object({
      watermark: ClipsWatermarkPresetSchema.optional(),
    })
    .optional(),
});

export type GraphyPresets = z.infer<typeof GraphyPresetsSchema>;
export type WatermarkMode = z.infer<typeof WatermarkModeSchema>;
