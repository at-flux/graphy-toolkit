export const mediaFlagParams = {
  source: {
    brief: 'Source directory, file, or glob',
    kind: 'parsed' as const,
    parse: String,
    optional: true as const,
  },
  dist: {
    brief: 'Output directory',
    kind: 'parsed' as const,
    parse: String,
    optional: true as const,
  },
  presets: {
    brief: 'Presets JSON (default: graphy-release.presets.json in cwd)',
    kind: 'parsed' as const,
    parse: String,
    optional: true as const,
  },
  pipeline: {
    brief: 'Run only this named pipeline from presets',
    kind: 'parsed' as const,
    parse: String,
    optional: true as const,
  },
  quiet: {
    brief: 'No progress output',
    kind: 'boolean' as const,
    optional: true as const,
  },
  failFast: {
    brief: 'Stop on first file/pipeline error',
    kind: 'boolean' as const,
    optional: true as const,
  },
};
