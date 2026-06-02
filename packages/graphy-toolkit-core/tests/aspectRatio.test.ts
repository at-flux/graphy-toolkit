import { describe, expect, it } from "vitest";
import { logDistance, ratio } from "../src/aspectRatio.js";

describe("aspectRatio", () => {
  it("computes width over height", () => {
    expect(ratio(1920, 1080)).toBeCloseTo(16 / 9, 5);
  });

  it("is symmetric in log space", () => {
    const a = ratio(3, 2);
    const b = ratio(2, 3);
    expect(logDistance(a, b)).toBeCloseTo(logDistance(b, a), 10);
  });
});
