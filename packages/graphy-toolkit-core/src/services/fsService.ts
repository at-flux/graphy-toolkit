import { promises as fs } from 'node:fs';
import path from 'node:path';

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
  const markedSuffix = marked ? '' : '-unmarked';
  const outRelativePath = `${extlessPath}-${variantSuffix}${markedSuffix}${ext}`;
  return path.join(distRoot, outRelativePath);
}
