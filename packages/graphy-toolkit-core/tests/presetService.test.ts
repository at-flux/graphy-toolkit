import { describe, expect, it } from 'vitest';
import { GraphyPresetsSchema } from '../src/schemas/presets.js';
import { mergePreset } from '../src/services/presetService.js';

describe('presetService', () => {
  it('parses minimal presets document', () => {
    const parsed = GraphyPresetsSchema.parse({
      stills: { release: { watermark: './logo.svg' } },
    });
    expect(parsed.stills?.release?.watermark).toBe('./logo.svg');
  });

  it('merges preset layers with override winning', () => {
    const merged = mergePreset({ opacity: 0.2, sizeRatio: 0.1 }, { opacity: 0.5 });
    expect(merged.opacity).toBe(0.5);
    expect(merged.sizeRatio).toBe(0.1);
  });

  it('ignores undefined override keys so preset values remain', () => {
    const merged = mergePreset(
      { watermark: './brand.svg', sourceRoot: './images' },
      { watermark: undefined, sourceRoot: undefined },
    );
    expect(merged.watermark).toBe('./brand.svg');
    expect(merged.sourceRoot).toBe('./images');
  });
});
