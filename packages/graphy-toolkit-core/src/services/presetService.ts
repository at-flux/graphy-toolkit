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
  const merged = { ...(base ?? ({} as T)) };
  if (override) {
    for (const [key, value] of Object.entries(override)) {
      if (value !== undefined) {
        (merged as Record<string, unknown>)[key] = value;
      }
    }
  }
  return merged as T;
}
