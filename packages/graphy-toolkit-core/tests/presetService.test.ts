import { describe, expect, it } from 'vitest';
import { GraphyPresetsSchema } from '../src/schemas/presets.js';
import { mergePreset } from '../src/services/presetService.js';

describe('presetService', () => {
  it('parses steps + pipelines preset', () => {
    const parsed = GraphyPresetsSchema.parse({
      stills: {
        sourceRoot: './images',
        distRoot: './dist',
        steps: {
          encoding: { type: 'encoding' },
          '3x2': { type: 'resize', width: 3240, height: 2160, scale: 'fit' },
        },
        pipelines: [{ name: 'release', steps: ['3x2', 'encoding'] }],
      },
    });
    expect(parsed.stills?.pipelines[0]?.name).toBe('release');
    expect(parsed.stills?.steps.encoding?.type).toBe('encoding');
  });

  it('merges preset layers with override winning', () => {
    const merged = mergePreset({ opacity: 0.2, sizeRatio: 0.1 }, { opacity: 0.5 });
    expect(merged.opacity).toBe(0.5);
    expect(merged.sizeRatio).toBe(0.1);
  });

  it('ignores undefined override keys', () => {
    const merged = mergePreset(
      { watermark: './brand.svg' },
      { watermark: undefined },
    );
    expect(merged.watermark).toBe('./brand.svg');
  });
});
