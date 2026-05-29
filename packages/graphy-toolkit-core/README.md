# @at-flux/graphy-toolkit-core

[![npm version](https://img.shields.io/npm/v/@at-flux/graphy-toolkit-core)](https://www.npmjs.com/package/@at-flux/graphy-toolkit-core)
[![license: MIT](https://img.shields.io/npm/l/@at-flux/graphy-toolkit-core)](https://github.com/at-flux/graphy-toolkit/blob/main/LICENSE)

Pipeline engine and image/clip services for [graphy](../README.md): Sharp processing, Zod schemas, and preset-driven step execution.

```bash
npm install @at-flux/graphy-toolkit-core
```

```ts
import {
  loadPresetsFile,
  runMediaPipeline,
  pickAspectBucket,
} from '@at-flux/graphy-toolkit-core';

const presets = await loadPresetsFile('./graphy-release.presets.json');
const stills = presets.stills!;

await runMediaPipeline(
  {
    cwd: process.cwd(),
    sourceFiles: ['/photos/img.jpg'],
    sourceRoot: '/photos',
    distRoot: '/out',
    section: stills,
  },
  'stills',
);
```

## Modules

| Area | Exports |
|------|---------|
| Geometry | `aspectRatio`, `aspectBucket`, `pickAspectBucket` |
| Schemas | `StepSchema`, `GraphyPresetsSchema`, `PipelineSchema` |
| Pipeline | `runMediaPipeline`, `collectSettings` |
| Services | `stillService`, `clipService`, `exifService`, `copyrightService`, `watermarkService`, `fsService`, `presetService` |
| Presets | `GraphyPresetsSchema`, `loadPresetsFile`, `mergePreset` |

Full CLI and preset reference: [monorepo README](../README.md).
