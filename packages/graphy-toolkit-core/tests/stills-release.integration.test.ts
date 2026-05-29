import { existsSync } from 'node:fs';
import { describe, expect, it } from 'vitest';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import sharp from 'sharp';
import { stillsReleaseAction } from '../src/actions/stills/release.js';

const repoRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../../..');
const fixtureRoot = path.resolve(repoRoot, '../test');
const imagesDir = path.join(fixtureRoot, 'images');
const distDir = path.join(fixtureRoot, 'dist-integration');
const watermark = path.join(fixtureRoot, 'brand.svg');
const sample = path.join(imagesDir, 'P1017123.JPG');
const hasFixtures = existsSync(sample);

describe.skipIf(!hasFixtures)('stills release integration', () => {
  it('writes main + thumbs and preserves EXIF tags', async () => {
    const before = await sharp(sample).metadata();

    const result = await stillsReleaseAction.run(
      {
        sourceRoot: imagesDir,
        sourceFiles: [sample],
        distRoot: distDir,
        watermarkPath: watermark,
        watermarkMode: 'marked-only',
        copyright: '',
      },
      {},
    );

    expect(result.processed).toBe(1);
    expect(result.written.length).toBe(3);

    const mainOut = result.written.find((p) => p.includes('-3x2'));
    expect(mainOut).toBeDefined();

    const after = await sharp(mainOut!).metadata();
    expect(after.width).toBeLessThanOrEqual(before.width ?? Infinity);
    expect(after.exif).toBeTruthy();
    expect(after.orientation).toBe(1);
  }, 120_000);
});
