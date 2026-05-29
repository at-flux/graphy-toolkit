import { existsSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { describe, expect, it } from 'vitest';
import { resolveIO, resolveRelease } from '../src/config/resolve.js';

const repoRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../../..');
const fixtureRoot = path.resolve(repoRoot, '../test');
const hasFixtures = existsSync(path.join(fixtureRoot, 'graphy-release.presets.json'));

describe.skipIf(!hasFixtures)('resolveRelease', () => {
  it('loads release paths from graphy-release.presets.json without CLI flags', async () => {
    const resolved = await resolveRelease({}, fixtureRoot, 'release', 'stills');
    expect(resolved.watermarkPath).toBe(path.join(fixtureRoot, 'brand.svg'));
    expect(resolved.distRoot).toBe(path.join(fixtureRoot, 'dist'));
    expect(resolved.source.files.length).toBeGreaterThan(0);
    expect(resolved.presetsPath).toContain('graphy-release.presets.json');
  });

  it('resolveIO does not require watermark', async () => {
    const resolved = await resolveIO({}, fixtureRoot, 'size', 'stills');
    expect(resolved.source.files.length).toBeGreaterThan(0);
  });
});
