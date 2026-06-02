import { describe, expect, it } from "vitest";
import { pickAspectBucket } from "../src/aspectBucket.js";

describe("pickAspectBucket", () => {
  it("maps landscape DSLR ratio to 3x2", () => {
    expect(pickAspectBucket(6000, 4000).suffix).toBe("3x2");
  });

  it("maps portrait phone ratio to 2x3", () => {
    expect(pickAspectBucket(2160, 3240).suffix).toBe("2x3");
  });

  it("maps wide cinematic ratio to 16x9", () => {
    expect(pickAspectBucket(1920, 1080).suffix).toBe("16x9");
  });
});
