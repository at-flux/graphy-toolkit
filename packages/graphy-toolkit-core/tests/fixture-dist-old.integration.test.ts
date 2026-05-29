import { existsSync } from 'node:fs';
import { mkdtemp, readdir, rm } from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import sharp from 'sharp';
import { describe, expect, it } from 'vitest';
import { stillsReleaseAction } from '../src/actions/stills/release.js';
import { loadPresetsFile } from '../src/services/presetService.js';
import { resolveSourceSpec } from '../src/services/fsService.js';

const repoRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../../..');
const fixtureRoot = path.resolve(repoRoot, '../test');
const imagesDir = path.join(fixtureRoot, 'images');
const distOldDir = path.join(fixtureRoot, 'dist-old');
const presetsPath = path.join(fixtureRoot, 'graphy-release.presets.json');
const hasFixtures =
  existsSync(imagesDir) && existsSync(distOldDir) && existsSync(presetsPath);

describe.skipIf(!hasFixtures)('fixture dist-old parity', () => {
  it('matches dist-old filenames and pixel dimensions', async () => {
    const presets = await loadPresetsFile(presetsPath);
    const release = presets.stills?.release;
    expect(release?.watermark).toBeTruthy();

    const source = await resolveSourceSpec(release!.sourceRoot ?? './images', fixtureRoot);
    const distDir = await mkdtemp(path.join(os.tmpdir(), 'graphy-dist-old-'));

    try {
      const result = await stillsReleaseAction.run(
        {
          sourceRoot: source.sourceRoot,
          sourceFiles: source.files,
          distRoot: distDir,
          watermarkPath: path.resolve(fixtureRoot, release!.watermark!),
          watermarkMode: release!.watermarkMode ?? 'marked-only',
          copyright: '',
          encode: presets.stills?.size,
          watermark: presets.stills?.watermark,
        },
        {},
      );

      const refNames = (await readdir(distOldDir)).sort();
      const outNames = (await readdir(distDir)).sort();

      expect(outNames).toEqual(refNames);
      expect(result.written.sort()).toEqual(outNames.map((n) => path.join(distDir, n)).sort());
      expect(result.written.length).toBe(refNames.length);

      for (const name of refNames) {
        const refMeta = await sharp(path.join(distOldDir, name)).metadata();
        const outMeta = await sharp(path.join(distDir, name)).metadata();
        expect(outMeta.width, name).toBe(refMeta.width);
        expect(outMeta.height, name).toBe(refMeta.height);
        expect(outMeta.exif, `${name} exif`).toBeTruthy();
        expect(outMeta.orientation, `${name} orientation`).toBe(1);
      }
    } finally {
      await rm(distDir, { recursive: true, force: true });
    }
  }, 300_000);
});
