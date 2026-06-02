import path from "node:path";
import type { ProgressCallback } from "@at-flux/graphy-toolkit-core";
import { bold, dim } from "./ansi.js";

const BAR_WIDTH = 28;
const RENDER_INTERVAL_MS = 80;

function bar(ratio: number): string {
  const filled = Math.min(
    BAR_WIDTH,
    Math.max(0, Math.round(ratio * BAR_WIDTH)),
  );
  return `[${"█".repeat(filled)}${"░".repeat(BAR_WIDTH - filled)}]`;
}

function formatElapsed(ms: number): string {
  const sec = Math.floor(ms / 1000);
  if (sec < 60) return `${sec}s`;
  const min = Math.floor(sec / 60);
  const rem = sec % 60;
  return rem > 0 ? `${min}m ${rem}s` : `${min}m`;
}

export function formatRunElapsed(startedAt: number): string {
  return formatElapsed(Date.now() - startedAt);
}

export type ProgressOptions = {
  label: string;
  pipelineNames: string[];
};

export function createProgressHandler(options: ProgressOptions): {
  onProgress: ProgressCallback;
  startedAt: number;
} {
  const startedAt = Date.now();
  const pipelineNames = options.pipelineNames;
  const nameWidth = Math.max(8, ...pipelineNames.map((n) => n.length));
  const completedByPipeline = new Map(pipelineNames.map((n) => [n, 0]));
  const activePipelines = new Set<string>();

  let totalFiles = 0;
  let currentFile = "";
  let linesDrawn = 0;
  let renderTimer: ReturnType<typeof setTimeout> | undefined;
  let renderPending = false;

  function renderNow(): void {
    renderPending = false;
    if (totalFiles === 0) return;

    const rows: string[] = [dim(options.label)];

    if (currentFile) {
      rows.push(`  ${dim("file")} ${bold(path.basename(currentFile))}`);
    }

    for (const name of pipelineNames) {
      const completed = completedByPipeline.get(name) ?? 0;
      const ratio = completed / totalFiles;
      const padded = name.padEnd(nameWidth);
      const label = activePipelines.has(name) ? bold(padded) : dim(padded);
      rows.push(`  ${label} ${bar(ratio)} ${completed}/${totalFiles}`);
    }

    if (linesDrawn > 0) {
      process.stderr.write(`\x1b[${linesDrawn}F`);
    }
    for (const row of rows) {
      process.stderr.write(`\x1b[2K${row}\n`);
    }
    linesDrawn = rows.length;
  }

  function render(): void {
    if (renderPending) return;
    renderPending = true;
    if (renderTimer) clearTimeout(renderTimer);
    renderTimer = setTimeout(renderNow, RENDER_INTERVAL_MS);
  }

  function flushRender(): void {
    if (renderTimer) clearTimeout(renderTimer);
    renderTimer = undefined;
    renderPending = false;
    renderNow();
  }

  function clear(): void {
    if (renderTimer) clearTimeout(renderTimer);
    renderTimer = undefined;
    renderPending = false;
    if (linesDrawn === 0) return;
    process.stderr.write(`\x1b[${linesDrawn}F`);
    for (let i = 0; i < linesDrawn; i++) {
      process.stderr.write("\x1b[2K\n");
    }
    process.stderr.write(`\x1b[${linesDrawn}F`);
    linesDrawn = 0;
  }

  const onProgress: ProgressCallback = (event) => {
    if (event.total != null) totalFiles = event.total;

    if (event.phase === "pipeline-batch") {
      currentFile = "";
      activePipelines.clear();
      if (event.pipeline) activePipelines.add(event.pipeline);
      render();
      return;
    }

    if (event.phase === "file") {
      currentFile = event.file ?? currentFile;
      render();
      return;
    }

    if (event.phase === "pipeline") {
      currentFile = event.file ?? currentFile;
      if (event.pipeline) activePipelines.add(event.pipeline);
      render();
      return;
    }

    if (event.phase === "pipeline-done") {
      if (event.file) currentFile = event.file;
      if (event.pipeline) {
        activePipelines.delete(event.pipeline);
        completedByPipeline.set(
          event.pipeline,
          (completedByPipeline.get(event.pipeline) ?? 0) + 1,
        );
      }
      render();
      return;
    }

    if (event.phase === "file-done") {
      if (event.file) currentFile = event.file;
      activePipelines.clear();
      render();
      return;
    }

    if (event.phase === "done") {
      flushRender();
      clear();
    }
  };

  return { onProgress, startedAt };
}
