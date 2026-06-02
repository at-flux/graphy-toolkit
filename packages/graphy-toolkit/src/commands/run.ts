import path from "node:path";
import {
  collectSettings,
  type ResolvedSettings,
  type RunMediaResult,
} from "@at-flux/graphy-toolkit-core";
import type { ResolvedMedia } from "../config/resolve.js";
import { bold, cyan, dim, green, yellow } from "../ui/ansi.js";
import { formatRunElapsed } from "../ui/progress.js";

function rel(cwd: string, abs: string): string {
  const r = path.relative(cwd, abs);
  if (!r || r.startsWith("..")) return abs;
  return r.startsWith(".") ? r : `./${r}`;
}

function formatAppliedLines(cwd: string, settings: ResolvedSettings): string[] {
  const applied: string[] = [];
  if (settings.watermark) {
    applied.push(
      `watermark ${rel(cwd, path.resolve(cwd, settings.watermark.path))}`,
    );
    applied.push(`opacity ${Math.round(settings.watermark.opacity * 100)}%`);
    applied.push(
      `mark size ${Math.round(settings.watermark.sizeRatio * 100)}%`,
    );
  }
  if (settings.jpegQuality != null)
    applied.push(`jpeg quality ${settings.jpegQuality}`);
  if (settings.copyright) applied.push(`copyright "${settings.copyright}"`);
  return applied;
}

export function startRun(command: string, resolved: ResolvedMedia): void {
  const { cwd, source, distRoot, settings, presetsPath } = resolved;
  process.stderr.write(`\n${bold("graphy")} ${cyan(command)}\n\n`);
  const n = source.files.length;
  process.stderr.write(
    `  ${dim("source")}     ${bold(String(n))} ${n === 1 ? "file" : "files"} — ${rel(cwd, source.sourceRoot)}\n`,
  );
  process.stderr.write(`  ${dim("output")}     ${rel(cwd, distRoot)}\n`);
  if (presetsPath) {
    process.stderr.write(
      `  ${dim("presets")}    ${rel(cwd, presetsPath)} ${green("loaded")}\n`,
    );
  }
  process.stderr.write(
    `  ${dim("pipelines")} ${settings.pipelines.join(", ")}\n`,
  );

  let wroteApplied = false;
  for (const pipeline of resolved.section.pipelines) {
    const pipelineSettings = collectSettings(
      [pipeline],
      resolved.section.steps,
    );
    const lines = formatAppliedLines(cwd, pipelineSettings);
    if (lines.length === 0) continue;
    if (!wroteApplied) process.stderr.write("\n");
    wroteApplied = true;
    process.stderr.write(`${dim("Applied")} ${cyan(pipeline.name)}\n`);
    for (const line of lines) {
      process.stderr.write(`  ${dim("·")} ${line}\n`);
    }
  }
  process.stderr.write("\n");
}

export function finishRun(
  result: RunMediaResult,
  quietFlag: boolean | undefined,
  presetQuiet: boolean,
  startedAt?: number,
): void {
  const quiet = quietFlag ?? presetQuiet;
  const uniqueWritten = result.written.length;
  const elapsed = startedAt != null ? formatRunElapsed(startedAt) : undefined;

  if (!quiet && result.errors.length > 0) {
    process.stderr.write(`\n${yellow("Errors")} (${result.errors.length})\n`);
    for (const e of result.errors) {
      const where = e.pipeline
        ? `${path.basename(e.file)} [${e.pipeline}]`
        : path.basename(e.file);
      process.stderr.write(`  ${dim("·")} ${where}: ${e.error.message}\n`);
    }
  }

  if (!quiet) {
    const timing = elapsed ? ` in ${elapsed}` : "";
    process.stderr.write(
      `\n${green("✓")} ${bold("Complete")} — ${result.processed} input(s), ${uniqueWritten} file(s) written${timing}\n`,
    );
  }

  console.log(
    `done: ${result.processed} input(s), ${uniqueWritten} file(s) written`,
  );
  if (result.errors.length > 0 && !quiet) {
    console.log(`errors: ${result.errors.length}`);
  }
}
