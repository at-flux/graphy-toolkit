# @at-flux/graphy-toolkit

[![npm version](https://img.shields.io/npm/v/@at-flux/graphy-toolkit)](https://www.npmjs.com/package/@at-flux/graphy-toolkit)
[![license: MIT](https://img.shields.io/npm/l/@at-flux/graphy-toolkit)](https://github.com/at-flux/graphy-toolkit/blob/main/LICENSE)

Stricli CLI for [graphy](../README.md) still and clip release pipelines.

```bash
pnpm dlx @at-flux/graphy-toolkit stills release --presets graphy-release.presets.json
```

## Local development

From the monorepo root (after `pnpm build`):

```bash
pnpm graphy stills release
pnpm graphy --help
node packages/graphy-toolkit/dist/bin/graphy.js stills release
```

Pack and test as consumers will:

```bash
pnpm --filter @at-flux/graphy-toolkit pack
pnpm dlx ./packages/graphy-toolkit/at-flux-graphy-toolkit-0.1.0.tgz stills release ...
```

Portable binary: `pnpm compile:graphy` → `dist/bin/graphy`.

Commands, flags, and presets: [monorepo README](../README.md).
