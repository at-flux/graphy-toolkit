import { z } from "zod";
import { PipelineSchema, StepSchema } from "./steps.js";

const StepsRecordSchema = z.record(z.string(), StepSchema);

const MediaSectionSchema = z.object({
  sourceRoot: z.string().default("./images"),
  distRoot: z.string().default("./dist"),
  quiet: z.boolean().default(false),
  steps: StepsRecordSchema,
  pipelines: z.array(PipelineSchema).min(1),
});

function normalizeSection(raw: unknown): unknown {
  if (typeof raw !== "object" || raw === null) return raw;
  const obj = { ...(raw as Record<string, unknown>) };
  if ("queit" in obj && !("quiet" in obj)) {
    obj.quiet = obj.queit;
    delete obj.queit;
  }
  return obj;
}

const ClipsSectionSchema = z.preprocess(
  (raw) => {
    const obj = normalizeSection(raw) as Record<string, unknown>;
    if (typeof obj !== "object" || obj === null) return obj;
    const steps = {
      ...((obj.mappings as Record<string, unknown>) ?? {}),
      ...((obj.steps as Record<string, unknown>) ?? {}),
    };
    let pipelines = obj.pipelines;
    if (
      Array.isArray(pipelines) &&
      pipelines.length > 0 &&
      Array.isArray(pipelines[0])
    ) {
      pipelines = (pipelines as string[][]).map((steps, i) => ({
        name: i === 0 ? "default" : `pipeline-${i}`,
        steps,
      }));
    }
    return { ...obj, steps, pipelines };
  },
  MediaSectionSchema.extend({
    sourceRoot: z.string().default("./clips"),
  }),
);

export const GraphyPresetsSchema = z.object({
  stills: z.preprocess(normalizeSection, MediaSectionSchema).optional(),
  clips: ClipsSectionSchema.optional(),
});

export type GraphyPresets = z.infer<typeof GraphyPresetsSchema>;
export type MediaSection = z.infer<typeof MediaSectionSchema>;
