#!/usr/bin/env node
import { buildApplication, buildRouteMap, run } from '@stricli/core';
import { clipsCommand } from '../commands/clips.js';
import { installRoutes } from '../commands/install.js';
import { stillsCommand } from '../commands/stills.js';

const app = buildApplication(
  buildRouteMap({
    routes: {
      stills: stillsCommand,
      clips: clipsCommand,
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
  await run(app, process.argv.slice(2), { process });
}

main().catch((error: unknown) => {
  console.error(error);
  process.exit(1);
});
