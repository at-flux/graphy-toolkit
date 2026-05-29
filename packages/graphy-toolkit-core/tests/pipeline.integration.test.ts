import { existsSync } from 'node:fs';
import { mkdtemp, readdir, rm } from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import sharp from 'sharp';
import { describe, expect, it } from 'vitest';
import { loadPresetsFile } from '../src/services/presetService.js';
import { resolveSourceSpec } from '../src/services/fsService.js';
import { runMediaPipeline } from '../src/pipeline/runner.js';
import { IMAGE_REGEX } from '../src/services/stillService.js';

const repoRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../../..');
const fixtureRoot = path.resolve(repoRoot, '../test');
const presetsPath = path.join(fixtureRoot, 'graphy-release.presets.json');
const sample = path.join(fixtureRoot, 'images/P1017123.JPG');
const hasFixtures = existsSync(sample) && existsSync(presetsPath);

describe.skipIf(!hasFixtures)('pipeline integration', () => {
  it('runs release pipeline on one image with EXIF preserved', async () => {
    const presets = await loadPresetsFile(presetsPath);
    const stills = presets.stills!;
    const distDir = await mkdtemp(path.join(os.tmpdir(), 'graphy-pipe-'));
    const source = await resolveSourceSpec('./images/P1017123.JPG', fixtureRoot);

    try {
      const releaseOnly = {
        ...stills,
        pipelines: stills.pipelines.filter((p) => p.name === 'release'),
      };

      const result = await runMediaPipeline(
        {
          cwd: fixtureRoot,
          sourceFiles: source.files,
          sourceRoot: source.sourceRoot,
          distRoot: distDir,
          section: releaseOnly,
        },
        'stills',
      );

      expect(result.errors).toEqual([]);
      expect(result.written.length).toBe(1);

      const out = result.written[0]!;
      expect(path.basename(out)).toMatch(/P1017123-3x2\.JPG$/i);
      const meta = await sharp(out).metadata();
      expect(meta.exif).toBeTruthy();
      expect(meta.orientation).toBe(1);
    } finally {
      await rm(distDir, { recursive: true, force: true });
    }
  }, 60_000);
});

describe.skipIf(!hasFixtures)('fixture dist-old parity', () => {
  it('release pipeline outputs match dist-old basenames and dimensions', async () => {
    const presets = await loadPresetsFile(presetsPath);
    const stills = presets.stills!;
    const distOldDir = path.join(fixtureRoot, 'dist-old');
    const distDir = await mkdtemp(path.join(os.tmpdir(), 'graphy-dist-old-'));
    const source = await resolveSourceSpec(stills.sourceRoot, fixtureRoot);

    try {
      const result = await runMediaPipeline(
        {
          cwd: fixtureRoot,
          sourceFiles: source.files,
          sourceRoot: source.sourceRoot,
          distRoot: distDir,
          section: stills,
          concurrency: 4,
        },
        'stills',
      );

      const refNames = (await readdir(distOldDir))
        .filter((n) => IMAGE_REGEX.test(n) && n !== 'nsfw')
        .sort();
      const writtenBasenames = [...new Set(result.written.map((p) => path.basename(p)))].sort();

      function resolveWrittenName(refName: string): string | undefined {
        const lower = refName.toLowerCase();
        const exact = writtenBasenames.find((n) => n.toLowerCase() === lower);
        if (exact) return exact;
        const altLower = lower.replace(/-2x3(\.|[-_])/, '-3x2$1');
        return writtenBasenames.find((n) => n.toLowerCase() === altLower);
      }

      for (const name of refNames) {
        const match = resolveWrittenName(name);
        expect(match, `missing ${name}`).toBeDefined();
      }

      function refStem(name: string): string {
        return name.replace(/-thumb-(1x1|3x1).*$/i, '').replace(/-\d+x\d+.*$/i, '');
      }

      const aliasedStems = new Set<string>();
      for (const name of refNames) {
        if (resolveWrittenName(name) !== name) aliasedStems.add(refStem(name));
      }

      for (const name of refNames) {
        const match = resolveWrittenName(name)!;
        const outPath = result.written.find((f) => path.basename(f) === match);
        expect(outPath, match).toBeDefined();
        if (match !== name || aliasedStems.has(refStem(name))) continue;
        const refMeta = await sharp(path.join(distOldDir, name)).metadata();
        const outMeta = await sharp(outPath!).metadata();
        expect(outMeta.width, match).toBe(refMeta.width);
        expect(outMeta.height, match).toBe(refMeta.height);
      }
    } finally {
      await rm(distDir, { recursive: true, force: true });
    }
  }, 300_000);
});
