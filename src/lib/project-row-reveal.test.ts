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

  it("keeps rows hidden during the title-led part of the projects entry", () => {
    expect(
      projectRowReveal({
        rowTop: 500,
        viewportHeight: 800,
        entryProgress: 0.12,
        rowIndex: 0,
        rowCount: 4,
      }),
    ).toBe(0);
  });

  it("waits for each row's entry slot even when the row is already in view", () => {
    const firstRow = projectRowReveal({
      rowTop: 500,
      viewportHeight: 800,
      entryProgress: 0.24,
      rowIndex: 0,
      rowCount: 4,
    });
    const secondRow = projectRowReveal({
      rowTop: 500,
      viewportHeight: 800,
      entryProgress: 0.24,
      rowIndex: 1,
      rowCount: 4,
    });

    expect(firstRow).toBeGreaterThan(0);
    expect(secondRow).toBe(0);
  });

  it("falls back to the original viewport reveal once entry sequencing is complete", () => {
    expect(
      projectRowReveal({
        rowTop: 500,
        viewportHeight: 800,
        entryProgress: 1,
        rowIndex: 8,
        rowCount: 9,
      }),
    ).toBe(1);
  });
});
