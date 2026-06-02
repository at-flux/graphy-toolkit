import { z } from "zod";

export const WatermarkStepSchema = z.object({
  type: z.literal("watermark"),
  watermark: z.string(),
  opacity: z.number().min(0).max(1).default(0.22),
  sizeRatio: z.number().positive().default(0.1),
  paddingRatio: z.number().min(0).default(0.02),
});

export const FilenameStepSchema = z.object({
  type: z.literal("filename"),
  suffix: z.string(),
});

export const ResizeStepSchema = z.object({
  type: z.literal("resize"),
  width: z.number().int().positive(),
  height: z.number().int().positive(),
  scale: z.enum(["fit", "crop"]).default("fit"),
  align: z.enum(["center"]).default("center"),
  suffix: z.string().optional(),
});

export const CopyrightStepSchema = z.object({
  type: z.literal("copyright"),
  copyright: z.string().default(""),
});

export const EncodingStepSchema = z.object({
  type: z.literal("encoding"),
  jpegQuality: z.number().int().min(1).max(100).default(84),
});

export const StepSchema = z.discriminatedUnion("type", [
  WatermarkStepSchema,
  FilenameStepSchema,
  ResizeStepSchema,
  CopyrightStepSchema,
  EncodingStepSchema,
]);

export type Step = z.infer<typeof StepSchema>;
export type WatermarkStep = z.infer<typeof WatermarkStepSchema>;
export type FilenameStep = z.infer<typeof FilenameStepSchema>;
export type ResizeStep = z.infer<typeof ResizeStepSchema>;
export type CopyrightStep = z.infer<typeof CopyrightStepSchema>;
export type EncodingStep = z.infer<typeof EncodingStepSchema>;

/** Default encoding step when a pipeline references "encoding" by name. */
export const DEFAULT_ENCODING_STEP: EncodingStep = EncodingStepSchema.parse({
  type: "encoding",
});

export type StepRef = string | string[];

export const PipelineSchema = z.object({
  name: z.string(),
  steps: z.array(z.union([z.string(), z.array(z.string())])),
});

export type Pipeline = z.infer<typeof PipelineSchema>;
