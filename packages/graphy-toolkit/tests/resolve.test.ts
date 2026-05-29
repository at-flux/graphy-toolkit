import { existsSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { describe, expect, it } from 'vitest';
import { resolveMedia } from '../src/config/resolve.js';

const repoRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../../..');
const fixtureRoot = path.resolve(repoRoot, '../test');
const hasFixtures = existsSync(path.join(fixtureRoot, 'graphy-release.presets.json'));

describe.skipIf(!hasFixtures)('resolveMedia', () => {
  it('loads stills section and applied settings from presets', async () => {
    const resolved = await resolveMedia({}, fixtureRoot, 'stills');
    expect(resolved.settings.pipelines).toContain('release');
    expect(resolved.settings.watermark?.path).toContain('brand.svg');
    expect(resolved.settings.jpegQuality).toBe(84);
    expect(resolved.settings.copyright).toBe('atflux');
    expect(resolved.source.files.length).toBeGreaterThan(0);
  });
});
