import { describe, expect, it } from "vitest";
import {
  commonDirectoryPrefix,
  resolveSourceSpec,
} from "../src/services/fsService.js";
import { mkdtemp, writeFile, mkdir } from "node:fs/promises";
import path from "node:path";
import os from "node:os";

describe("resolveSourceSpec", () => {
  it("resolves a directory to all nested files", async () => {
    const dir = await mkdtemp(path.join(os.tmpdir(), "graphy-src-"));
    await writeFile(path.join(dir, "a.jpg"), "x");
    await mkdir(path.join(dir, "nested"), { recursive: true });
    await writeFile(path.join(dir, "nested", "b.png"), "x");
    const resolved = await resolveSourceSpec(dir, process.cwd());
    expect(resolved.files).toHaveLength(2);
    expect(resolved.sourceRoot).toBe(dir);
  });

  it("resolves a glob pattern", async () => {
    const dir = await mkdtemp(path.join(os.tmpdir(), "graphy-glob-"));
    await writeFile(path.join(dir, "keep.JPG"), "x");
    await writeFile(path.join(dir, "skip.txt"), "x");
    const pattern = path.join(dir, "*.JPG");
    const resolved = await resolveSourceSpec(pattern, process.cwd());
    expect(resolved.files).toHaveLength(1);
    expect(resolved.sourceRoot).toBe(dir);
  });

  it("throws when a directory has no images", async () => {
    const dir = await mkdtemp(path.join(os.tmpdir(), "graphy-empty-"));
    await writeFile(path.join(dir, "readme.txt"), "x");
    await expect(resolveSourceSpec(dir, process.cwd())).rejects.toThrow(
      /No matching files/,
    );
  });
});

describe("commonDirectoryPrefix", () => {
  it("returns shared parent for files in subfolders", () => {
    const root = commonDirectoryPrefix(["/tmp/a/x.jpg", "/tmp/a/nested/y.jpg"]);
    expect(root).toBe("/tmp/a");
  });
});
