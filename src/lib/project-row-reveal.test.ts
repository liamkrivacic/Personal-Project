import { describe, expect, it } from "vitest";
import { projectRowReveal } from "./project-row-reveal";

describe("projectRowReveal", () => {
  it("is hidden before the row approaches the viewport", () => {
    expect(projectRowReveal({ rowTop: 900, viewportHeight: 800 })).toBe(0);
  });

  it("fades in while the row enters the viewport", () => {
    const reveal = projectRowReveal({ rowTop: 700, viewportHeight: 800 });
    expect(reveal).toBeGreaterThan(0);
    expect(reveal).toBeLessThan(1);
  });

  it("is fully visible once the row is comfortably inside the viewport", () => {
    expect(projectRowReveal({ rowTop: 500, viewportHeight: 800 })).toBe(1);
  });

  it("clamps invalid viewport heights to visible", () => {
    expect(projectRowReveal({ rowTop: 700, viewportHeight: 0 })).toBe(1);
  });
});
