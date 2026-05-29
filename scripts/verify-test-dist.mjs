#!/usr/bin/env node
/** Compare test/dist against test/dist-old (reference basenames + dimensions). */
import { readdir } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import sharp from 'sharp';

const IMAGE_REGEX = /\.(jpe?g|png|webp|avif|tiff?)$/i;

const scriptDir = path.dirname(fileURLToPath(import.meta.url));
const fixtureRoot = path.resolve(scriptDir, '../../test');
const distDir = path.join(fixtureRoot, 'dist');
const distOldDir = path.join(fixtureRoot, 'dist-old');

function refStem(name) {
  return name.replace(/-thumb-(1x1|3x1).*$/i, '').replace(/-\d+x\d+.*$/i, '');
}

function resolveWrittenName(refName, writtenBasenames) {
  const lower = refName.toLowerCase();
  const exact = writtenBasenames.find((n) => n.toLowerCase() === lower);
  if (exact) return exact;
  const altLower = lower.replace(/-2x3(\.|[-_])/, '-3x2$1');
  return writtenBasenames.find((n) => n.toLowerCase() === altLower);
}

const refNames = (await readdir(distOldDir))
  .filter((n) => IMAGE_REGEX.test(n) && n !== 'nsfw')
  .sort();
const outNames = (await readdir(distDir)).sort();

const aliasedStems = new Set();
for (const name of refNames) {
  if (resolveWrittenName(name, outNames) !== name) aliasedStems.add(refStem(name));
}

const missing = [];
for (const name of refNames) {
  if (!resolveWrittenName(name, outNames)) missing.push(name);
}

if (missing.length > 0) {
  console.error('missing reference outputs:', missing.slice(0, 10));
  if (missing.length > 10) console.error(`… and ${missing.length - 10} more`);
  process.exit(1);
}

for (const name of refNames) {
  const match = resolveWrittenName(name, outNames);
  if (match !== name || aliasedStems.has(refStem(name))) continue;

  const refMeta = await sharp(path.join(distOldDir, name)).metadata();
  const outMeta = await sharp(path.join(distDir, match)).metadata();
  if (outMeta.width !== refMeta.width || outMeta.height !== refMeta.height) {
    console.error(`${match}: ${outMeta.width}x${outMeta.height} != ${refMeta.width}x${refMeta.height}`);
    process.exit(1);
  }
  if (!outMeta.exif) {
    console.error(`${match}: missing EXIF`);
    process.exit(1);
  }
}

console.log(`ok: ${refNames.length} reference file(s) matched in dist (names + dimensions + EXIF)`);
