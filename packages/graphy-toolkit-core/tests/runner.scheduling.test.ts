import { describe, expect, it, vi } from "vitest";
import type { MediaSection } from "../src/schemas/presets.js";

vi.mock("../src/pipeline/step-handlers.js", async (importOriginal) => {
  const actual =
    await importOriginal<typeof import("../src/pipeline/step-handlers.js")>();
  return {
    ...actual,
    createStillsContext: vi.fn(
      async (sourcePath: string, sourceRoot: string, distRoot: string) => ({
        sourcePath,
        sourceRoot,
        distRoot,
        buffer: null,
        width: 1,
        height: 1,
        aspectLabel: "1x1",
        suffix: "",
        branchKey: "",
        copyright: "",
        hasSourceCopyright: false,
        writtenPath: null,
        outputExt: ".jpg",
        jpegQuality: 84,
      }),
    ),
  };
});

const { runMediaPipeline } = await import("../src/pipeline/runner.js");

const section: MediaSection = {
  sourceRoot: ".",
  distRoot: ".",
  steps: {},
  pipelines: [
    { name: "first", steps: [] },
    { name: "second", steps: [] },
  ],
};

describe("runMediaPipeline scheduling", () => {
  it("defaults to pipeline-first order", async () => {
    const order: string[] = [];
    const files = ["a.jpg", "b.jpg"];

    await runMediaPipeline(
      {
        cwd: ".",
        sourceFiles: files,
        sourceRoot: ".",
        distRoot: ".",
        section,
        concurrency: 2,
        onProgress: (event) => {
          if (event.phase === "pipeline-batch" && event.pipeline) {
            order.push(`batch:${event.pipeline}`);
          }
          if (event.phase === "pipeline-done" && event.pipeline && event.file) {
            order.push(`done:${event.pipeline}:${event.file}`);
          }
        },
      },
      "stills",
    );

    expect(order.filter((e) => e.startsWith("batch:"))).toEqual([
      "batch:first",
      "batch:second",
    ]);
    expect(order.filter((e) => e.startsWith("done:first:"))).toHaveLength(2);
    expect(order.filter((e) => e.startsWith("done:second:"))).toHaveLength(2);
    expect(order.indexOf("batch:second")).toBeGreaterThan(
      order.lastIndexOf("done:first:b.jpg"),
    );
  });
});
