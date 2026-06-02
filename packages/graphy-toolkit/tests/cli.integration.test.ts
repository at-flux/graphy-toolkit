import { existsSync } from "node:fs";
import { spawnSync } from "node:child_process";
import { mkdtempSync } from "node:fs";
import os from "node:os";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";

const repoRoot = path.resolve(
  path.dirname(fileURLToPath(import.meta.url)),
  "../../..",
);
const fixtureRoot = path.resolve(repoRoot, "../test");
const graphyBin = path.join(
  repoRoot,
  "packages/graphy-toolkit/dist/bin/graphy.js",
);
const sampleImage = path.join(fixtureRoot, "images/P1017123.JPG");
const hasFixtures = existsSync(sampleImage) && existsSync(graphyBin);

describe.skipIf(!hasFixtures)("graphy CLI", () => {
  it("runs graphy stills with presets and applied settings logging", () => {
    const distDir = mkdtempSync(path.join(os.tmpdir(), "graphy-cli-"));
    const result = spawnSync(
      process.execPath,
      [
        graphyBin,
        "stills",
        "--pipeline",
        "release",
        "--source",
        "./images/P1017123.JPG",
        "--dist",
        distDir,
      ],
      { cwd: fixtureRoot, encoding: "utf8", timeout: 60_000 },
    );

    expect(result.status, result.stderr || result.stdout).toBe(0);
    expect(result.stderr).toContain("graphy");
    expect(result.stderr).toContain("brand.svg");
    expect(result.stderr).toContain("Applied");
    expect(result.stderr).toContain("release");
    expect(result.stderr).toContain('copyright "atflux"');
    expect(result.stderr).toContain("█");
    expect(result.stderr).toContain("file");
    expect(result.stderr).not.toContain("webp");
    expect(result.stdout).toMatch(/done: 1 input\(s\), 1 file\(s\) written/);
  });
});
