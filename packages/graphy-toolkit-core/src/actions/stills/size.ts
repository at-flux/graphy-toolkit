import { promises as fs } from 'node:fs';
import { pickAspectBucket } from '../../aspectBucket.js';
import { readMetadataAfterRotate } from '../../services/exifService.js';
import { hasExistingCopyright } from '../../services/copyrightService.js';
import { walkFiles } from '../../services/fsService.js';
import {
  IMAGE_REGEX,
  renderMainScaled,
  renderThumb1x1,
  renderThumb3x1,
} from '../../services/stillService.js';
import { defineAction } from '../chain.js';
import {
  EncodeQualitySchema,
  StillsSizeInputSchema,
  StillsSizeOutputSchema,
} from './schemas.js';

const DEFAULT_ENCODE = EncodeQualitySchema.parse({});

async function listSourceFiles(input: {
  sourceRoot: string;
  sourceFiles?: string[];
}): Promise<string[]> {
  const files =
    input.sourceFiles ??
    (await walkFiles(input.sourceRoot)).filter((f) => IMAGE_REGEX.test(f));
  return files.filter((f) => IMAGE_REGEX.test(f));
}

export const stillsSizeAction = defineAction({
  name: 'stills/size',
  inputSchema: StillsSizeInputSchema,
  outputSchema: StillsSizeOutputSchema,
  async run(input) {
    await fs.access(input.sourceRoot);
    await fs.mkdir(input.distRoot, { recursive: true });

    const encode = { ...DEFAULT_ENCODE, ...input.encode };
    const files = await listSourceFiles(input);
    if (files.length === 0) {
      throw new Error(`No image files found under source: ${input.sourceRoot}`);
    }

    const items = [];

    for (const sourceFilePath of files) {
      const meta = await readMetadataAfterRotate(sourceFilePath);
      const bucket = pickAspectBucket(meta.width ?? 0, meta.height ?? 0);
      const main = await renderMainScaled(sourceFilePath, bucket);
      const thumb1x1 = await renderThumb1x1(main.buffer);
      const thumb3x1 = await renderThumb3x1(main.buffer);

      items.push({
        sourceFilePath,
        main: {
          buffer: main.buffer,
          width: main.width,
          height: main.height,
          suffix: main.suffix,
        },
        thumb1x1: {
          buffer: thumb1x1.buffer,
          width: thumb1x1.width,
          height: thumb1x1.height,
          suffix: 'thumb-1x1',
        },
        thumb3x1: {
          buffer: thumb3x1.buffer,
          width: thumb3x1.width,
          height: thumb3x1.height,
          suffix: 'thumb-3x1',
        },
        hasCopyright: hasExistingCopyright(meta),
      });
    }

    return {
      sourceRoot: input.sourceRoot,
      distRoot: input.distRoot,
      encode,
      items,
    };
  },
});
