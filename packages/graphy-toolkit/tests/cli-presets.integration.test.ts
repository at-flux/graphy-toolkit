import { existsSync } from 'node:fs';
import { spawnSync } from 'node:child_process';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { describe, expect, it } from 'vitest';

const repoRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../../..');
const fixtureRoot = path.resolve(repoRoot, '../test');
const graphyBin = path.join(repoRoot, 'packages/graphy-toolkit/dist/bin/graphy.js');
const hasFixtures = existsSync(fixtureRoot) && existsSync(graphyBin);

describe.skipIf(!hasFixtures)('graphy CLI presets integration', () => {
  it('runs stills release from test cwd using graphy-release.presets.json only', () => {
    const result = spawnSync(process.execPath, [graphyBin, 'stills', 'release'], {
      cwd: fixtureRoot,
      encoding: 'utf8',
      timeout: 300_000,
    });

    expect(result.status, result.stderr || result.stdout).toBe(0);
    expect(result.stdout).toMatch(/done: \d+ still\(s\), 130 file\(s\) written/);
    expect(existsSync(path.join(fixtureRoot, 'dist'))).toBe(true);
  }, 300_000);
});
