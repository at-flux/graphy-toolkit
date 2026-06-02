import { promises as fs } from "node:fs";
import path from "node:path";
import fg from "fast-glob";
import { IMAGE_REGEX } from "./stillService.js";

export type ResolvedSource = {
  /** Directory used as the root for mirrored output paths */
  sourceRoot: string;
  /** Absolute paths to input files */
  files: string[];
};

const GLOB_CHARS = /[*?[{]/;

/** Longest common directory prefix for absolute file paths. */
export function commonDirectoryPrefix(paths: string[]): string {
  if (paths.length === 0) return process.cwd();
  const dirs = paths.map((f) => path.dirname(path.resolve(f)));
  if (dirs.length === 1) return dirs[0]!;
  const split = dirs.map((d) => d.split(path.sep));
  const first = split[0]!;
  const common: string[] = [];
  for (let i = 0; i < first.length; i++) {
    const seg = first[i];
    if (split.every((parts) => parts[i] === seg)) common.push(seg!);
    else break;
  }
  return common.length > 0 ? common.join(path.sep) : path.dirname(paths[0]!);
}

/**
 * Resolve `--source` to files. Accepts a directory, a single file, or a glob
 * (e.g. `./images`, `./images/*.JPG`, `**` + `/*.jpg`).
 */
export async function resolveSourceSpec(
  source: string,
  cwd: string,
  fileFilter: RegExp = IMAGE_REGEX,
): Promise<ResolvedSource> {
  const trimmed = source.trim();
  if (!trimmed) throw new Error("Source path or glob is required");

  if (GLOB_CHARS.test(trimmed)) {
    const files = (
      await fg(trimmed, { cwd, absolute: true, onlyFiles: true, dot: false })
    ).filter((f) => fileFilter.test(f));
    if (files.length === 0) {
      throw new Error(`No files matched source glob: ${trimmed}`);
    }
    return { sourceRoot: commonDirectoryPrefix(files), files };
  }

  const abs = path.resolve(cwd, trimmed);
  let stat;
  try {
    stat = await fs.stat(abs);
  } catch {
    throw new Error(`Source not found: ${abs}`);
  }

  if (stat.isDirectory()) {
    const files = (await walkFiles(abs)).filter((f) => fileFilter.test(f));
    if (files.length === 0) {
      throw new Error(`No matching files found under source directory: ${abs}`);
    }
    return { sourceRoot: abs, files };
  }

  if (!fileFilter.test(abs)) {
    throw new Error(`Source file type not supported: ${abs}`);
  }

  return { sourceRoot: path.dirname(abs), files: [abs] };
}

export async function walkFiles(dir: string): Promise<string[]> {
  const entries = await fs.readdir(dir, { withFileTypes: true });
  const nested = await Promise.all(
    entries.map(async (entry) => {
      const fullPath = path.join(dir, entry.name);
      return entry.isDirectory() ? walkFiles(fullPath) : [fullPath];
    }),
  );
  return nested.flat();
}

export async function ensureParentDir(filePath: string): Promise<void> {
  await fs.mkdir(path.dirname(filePath), { recursive: true });
}

export function buildMirroredOutputPath(
  sourceFilePath: string,
  sourceRoot: string,
  distRoot: string,
  variantSuffix: string,
  marked: boolean,
): string {
  const relativePath = path.relative(sourceRoot, sourceFilePath);
  const ext = path.extname(relativePath);
  const extlessPath = relativePath.slice(0, -ext.length);
  const markedSuffix = marked ? "" : "-unmarked";
  const outRelativePath = `${extlessPath}-${variantSuffix}${markedSuffix}${ext}`;
  return path.join(distRoot, outRelativePath);
}

/** Default preset filenames checked in cwd (first match wins). */
export const DEFAULT_PRESET_FILENAMES = [
  "graphy-release.presets.json",
  "graphy-presets.json",
] as const;

export async function findDefaultPresetsFile(
  cwd: string,
): Promise<string | undefined> {
  for (const name of DEFAULT_PRESET_FILENAMES) {
    const candidate = path.join(cwd, name);
    try {
      await fs.access(candidate);
      return candidate;
    } catch {
      /* try next */
    }
  }
  return undefined;
}
