import { buildCommand } from "@stricli/core";
import { mediaFlagParams } from "../config/flags.js";
import type { MediaFlags } from "../config/resolve.js";
import { runMediaCommand } from "./media.js";

export const clipsCommand = buildCommand({
  func: (flags: MediaFlags) => runMediaCommand("clips", flags),
  parameters: {
    flags: mediaFlagParams,
    positional: { kind: "tuple", parameters: [] },
  },
  docs: { brief: "Run clip pipelines from graphy-release.presets.json" },
});
