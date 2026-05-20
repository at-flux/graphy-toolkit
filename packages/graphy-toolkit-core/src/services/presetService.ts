import { promises as fs } from 'node:fs';
import { GraphyPresetsSchema, type GraphyPresets } from '../schemas/presets.js';

export async function loadPresetsFile(presetsPath: string): Promise<GraphyPresets> {
  const raw = await fs.readFile(presetsPath, 'utf8');
  const json: unknown = JSON.parse(raw);
  return GraphyPresetsSchema.parse(json);
}

export function mergePreset<T extends Record<string, unknown>>(
  base: T | undefined,
  override: Partial<T> | undefined,
): T {
  return { ...base, ...override } as T;
}
