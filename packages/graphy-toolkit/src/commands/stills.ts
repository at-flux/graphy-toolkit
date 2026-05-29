import { buildCommand } from '@stricli/core';
import { mediaFlagParams } from '../config/flags.js';
import type { MediaFlags } from '../config/resolve.js';
import { runMediaCommand } from './media.js';

export const stillsCommand = buildCommand({
  func: (flags: MediaFlags) => runMediaCommand('stills', flags),
  parameters: { flags: mediaFlagParams, positional: { kind: 'tuple', parameters: [] } },
  docs: { brief: 'Run stills pipelines from graphy-release.presets.json' },
});
