#!/usr/bin/env node
/** Compare test/dist against test/dist-old (filenames + pixel dimensions). */
import { readdir } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import sharp from 'sharp';

const scriptDir = path.dirname(fileURLToPath(import.meta.url));
const fixtureRoot = path.resolve(scriptDir, '../../test');
const distDir = path.join(fixtureRoot, 'dist');
const distOldDir = path.join(fixtureRoot, 'dist-old');

const refNames = (await readdir(distOldDir)).sort();
const outNames = (await readdir(distDir)).sort();

if (outNames.join('\n') !== refNames.join('\n')) {
  const onlyOld = refNames.filter((n) => !outNames.includes(n));
  const onlyNew = outNames.filter((n) => !refNames.includes(n));
  console.error('filename mismatch');
  if (onlyOld.length) console.error('only in dist-old:', onlyOld.slice(0, 10));
  if (onlyNew.length) console.error('only in dist:', onlyNew.slice(0, 10));
  process.exit(1);
}

for (const name of refNames) {
  const refMeta = await sharp(path.join(distOldDir, name)).metadata();
  const outMeta = await sharp(path.join(distDir, name)).metadata();
  if (outMeta.width !== refMeta.width || outMeta.height !== refMeta.height) {
    console.error(`${name}: ${outMeta.width}x${outMeta.height} != ${refMeta.width}x${refMeta.height}`);
    process.exit(1);
  }
  if (!outMeta.exif) {
    console.error(`${name}: missing EXIF`);
    process.exit(1);
  }
}

console.log(`ok: ${refNames.length} files match dist-old (names + dimensions + EXIF)`);
