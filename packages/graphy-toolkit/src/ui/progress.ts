import path from 'node:path';
import type { ProgressCallback } from '@at-flux/graphy-toolkit-core';
import { bold, dim } from './ansi.js';

const BAR_WIDTH = 28;

function bar(ratio: number): string {
  const filled = Math.min(BAR_WIDTH, Math.max(0, Math.round(ratio * BAR_WIDTH)));
  return `[${'█'.repeat(filled)}${'░'.repeat(BAR_WIDTH - filled)}]`;
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
  let total = 0;
  let completed = 0;
  let currentFile = '';
  let currentPipeline = '';
  let linesDrawn = 0;

  function render(): void {
    if (total === 0) return;

    const ratio = completed / total;
    const rows: string[] = [];

    if (currentFile) {
      rows.push(`  ${dim('file')}      ${bold(path.basename(currentFile))}`);
    }
    if (options.pipelineNames.length > 0) {
      const pipeline = currentPipeline || options.pipelineNames.join(', ');
      rows.push(`  ${dim('pipeline')} ${pipeline}`);
    }
    rows.push(`${options.label} ${bar(ratio)} ${completed}/${total}`);

    if (linesDrawn > 0) {
      process.stderr.write(`\x1b[${linesDrawn}F`);
    }
    for (const row of rows) {
      process.stderr.write(`\x1b[2K${row}\n`);
    }
    linesDrawn = rows.length;
  }

  function clear(): void {
    if (linesDrawn === 0) return;
    process.stderr.write(`\x1b[${linesDrawn}F`);
    for (let i = 0; i < linesDrawn; i++) {
      process.stderr.write('\x1b[2K\n');
    }
    process.stderr.write(`\x1b[${linesDrawn}F`);
    linesDrawn = 0;
  }

  const onProgress: ProgressCallback = (event) => {
    if (event.phase === 'file') {
      total = event.total ?? total;
      currentFile = event.file ?? currentFile;
      currentPipeline = '';
      render();
      return;
    }

    if (event.phase === 'pipeline') {
      total = event.total ?? total;
      currentFile = event.file ?? currentFile;
      currentPipeline = event.pipeline ?? currentPipeline;
      render();
      return;
    }

    if (event.phase === 'file-done') {
      completed = event.completed ?? completed + 1;
      total = event.total ?? total;
      if (event.file) currentFile = event.file;
      render();
      return;
    }

    if (event.phase === 'done') {
      clear();
    }
  };

  return { onProgress, startedAt };
}
