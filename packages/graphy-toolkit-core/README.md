# @at-flux/graphy-toolkit-core

[![npm version](https://img.shields.io/npm/v/@at-flux/graphy-toolkit-core)](https://www.npmjs.com/package/@at-flux/graphy-toolkit-core)
[![license: MIT](https://img.shields.io/npm/l/@at-flux/graphy-toolkit-core)](https://github.com/at-flux/graphy-toolkit/blob/main/LICENSE)

Composable still/clip processing for [graphy](../README.md): services, Zod schemas, and chainable actions.

```bash
npm install @at-flux/graphy-toolkit-core
```

```ts
import { stillsReleaseAction, pickAspectBucket } from '@at-flux/graphy-toolkit-core';

await stillsReleaseAction.run({
  sourceRoot: '/photos',
  distRoot: '/out',
  watermarkPath: '/brand.svg',
}, {});
```

## Modules

| Area | Exports |
|------|---------|
| Geometry | `aspectRatio`, `aspectBucket`, `pickAspectBucket` |
| Services | `stillService`, `clipService`, `exifService`, `copyrightService`, `watermarkService`, `fsService`, `presetService` |
| Actions | `stillsSizeAction`, `stillsWatermarkAction`, `stillsReleaseAction`, `clipsWatermarkAction` |
| Presets | `GraphyPresetsSchema`, `loadPresetsFile` |

Full CLI and preset reference: [monorepo README](../README.md).
