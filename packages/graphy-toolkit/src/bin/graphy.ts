#!/usr/bin/env node
import { buildApplication, buildRouteMap, run } from '@stricli/core';
import { clipsWatermarkCommand } from '../commands/clips.js';
import { installRoutes } from '../commands/install.js';
import {
  normalizeArgs,
  stillsReleaseCommand,
  stillsSizeCommand,
  stillsWatermarkCommand,
} from '../commands/stills.js';

const stillsRoutes = buildRouteMap({
  routes: {
    release: stillsReleaseCommand,
    size: stillsSizeCommand,
    watermark: stillsWatermarkCommand,
  },
  docs: { brief: 'Photo still processing' },
});

const clipsRoutes = buildRouteMap({
  routes: {
    watermark: clipsWatermarkCommand,
  },
  docs: { brief: 'Video clip processing (ffmpeg watermark overlay)' },
});

const app = buildApplication(
  buildRouteMap({
    routes: {
      stills: stillsRoutes,
      clips: clipsRoutes,
      install: installRoutes,
    },
    docs: { brief: 'Graphy media release toolkit' },
  }),
  {
    name: 'graphy',
    scanner: { caseStyle: 'allow-kebab-for-camel' },
    documentation: { caseStyle: 'convert-camel-to-kebab' },
  },
);

async function main(): Promise<void> {
  const args = normalizeArgs(process.argv.slice(2));
  await run(app, args, { process });
}

main().catch((error: unknown) => {
  console.error(error);
  process.exit(1);
});
