import { describe, expect, it } from "vitest";
import { collectSettings } from "../src/pipeline/context.js";
import type { Step } from "../src/schemas/steps.js";

describe("collectSettings", () => {
  const steps: Record<string, Step> = {
    encoding: { type: "encoding", jpegQuality: 95 },
    watermark: {
      type: "watermark",
      watermark: "./brand.svg",
      opacity: 0.22,
      sizeRatio: 0.1,
      paddingRatio: 0.02,
    },
    copyright: { type: "copyright", copyright: "atflux" },
    resize: { type: "resize", width: 100, height: 100, scale: "fit" },
  };

  it("collects only steps used by each pipeline", () => {
    const release = collectSettings(
      [{ name: "release", steps: ["copyright", "watermark", "encoding"] }],
      steps,
    );
    const thumbnails = collectSettings(
      [{ name: "thumbnails", steps: ["resize", "watermark", "encoding"] }],
      steps,
    );

    expect(release.copyright).toBe("atflux");
    expect(thumbnails.copyright).toBeUndefined();
    expect(release.jpegQuality).toBe(95);
    expect(thumbnails.watermark?.path).toBe("./brand.svg");
  });
});
