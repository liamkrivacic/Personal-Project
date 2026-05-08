import { describe, expect, it } from "vitest";
import { nextVisualScrollY } from "./visual-scroll-smoothing";

describe("nextVisualScrollY", () => {
  it("moves toward the real scroll target without jumping all the way there", () => {
    const next = nextVisualScrollY({
      currentY: 0,
      targetY: 3600,
      viewportHeight: 900,
      elapsedMs: 16.7,
    });

    expect(next).toBeGreaterThan(0);
    expect(next).toBeLessThan(3600);
  });

  it("caps a fast wheel jump to a consistent per-frame visual distance", () => {
    const next = nextVisualScrollY({
      currentY: 0,
      targetY: 3600,
      viewportHeight: 900,
      elapsedMs: 16.7,
    });

    expect(next).toBeLessThanOrEqual(73);
  });

  it("settles exactly on the target once it is very close", () => {
    expect(
      nextVisualScrollY({
        currentY: 1200.3,
        targetY: 1200,
        viewportHeight: 900,
        elapsedMs: 16.7,
      }),
    ).toBe(1200);
  });

  it("handles upward scroll with the same capped rhythm", () => {
    const next = nextVisualScrollY({
      currentY: 3600,
      targetY: 0,
      viewportHeight: 900,
      elapsedMs: 16.7,
    });

    expect(next).toBeLessThan(3600);
    expect(next).toBeGreaterThanOrEqual(3527);
  });
});
