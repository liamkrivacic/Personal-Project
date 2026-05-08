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

  it("keeps rows hidden until the projects heading is almost fully revealed", () => {
    expect(
      projectRowReveal({
        rowTop: 500,
        viewportHeight: 800,
        entryProgress: 1,
        headingProgress: 0.86,
        rowIndex: 0,
        rowCount: 4,
      }),
    ).toBe(0);
  });

  it("waits for each row's entry slot even when the row is already in view", () => {
    const firstRow = projectRowReveal({
      rowTop: 500,
      viewportHeight: 800,
      entryProgress: 0.6,
      headingProgress: 1,
      rowIndex: 0,
      rowCount: 4,
    });
    const secondRow = projectRowReveal({
      rowTop: 500,
      viewportHeight: 800,
      entryProgress: 0.6,
      headingProgress: 1,
      rowIndex: 1,
      rowCount: 4,
    });

    expect(firstRow).toBeGreaterThan(0);
    expect(secondRow).toBe(0);
  });

  it("gives the first project card its own entry beat before the second card appears", () => {
    const firstRow = projectRowReveal({
      rowTop: 500,
      viewportHeight: 800,
      entryProgress: 0.5,
      headingProgress: 1,
      rowIndex: 0,
      rowCount: 9,
    });
    const secondRow = projectRowReveal({
      rowTop: 500,
      viewportHeight: 800,
      entryProgress: 0.5,
      headingProgress: 1,
      rowIndex: 1,
      rowCount: 9,
    });

    expect(firstRow).toBeGreaterThan(0);
    expect(firstRow).toBeLessThan(1);
    expect(secondRow).toBe(0);
  });

  it("keeps only a short beat after the heading before the first project card starts", () => {
    expect(
      projectRowReveal({
        rowTop: 500,
        viewportHeight: 800,
        entryProgress: 0.23,
        headingProgress: 1,
        rowIndex: 0,
        rowCount: 9,
      }),
    ).toBe(0);
  });

  it("starts the first project card soon after the heading has appeared", () => {
    const firstRow = projectRowReveal({
      rowTop: 500,
      viewportHeight: 800,
      entryProgress: 0.3,
      headingProgress: 1,
      rowIndex: 0,
      rowCount: 9,
    });
    const secondRow = projectRowReveal({
      rowTop: 500,
      viewportHeight: 800,
      entryProgress: 0.3,
      headingProgress: 1,
      rowIndex: 1,
      rowCount: 9,
    });

    expect(firstRow).toBeGreaterThan(0);
    expect(secondRow).toBe(0);
  });

  it("takes about twice as long to fully reveal each of the first two project cards", () => {
    const firstRowMidReveal = projectRowReveal({
      rowTop: 500,
      viewportHeight: 800,
      entryProgress: 0.5,
      headingProgress: 1,
      rowIndex: 0,
      rowCount: 9,
    });
    const secondRowMidReveal = projectRowReveal({
      rowTop: 500,
      viewportHeight: 800,
      entryProgress: 0.84,
      headingProgress: 1,
      rowIndex: 1,
      rowCount: 9,
    });

    expect(firstRowMidReveal).toBeGreaterThan(0.45);
    expect(firstRowMidReveal).toBeLessThan(0.9);
    expect(secondRowMidReveal).toBeGreaterThan(0.45);
    expect(secondRowMidReveal).toBeLessThan(0.9);
  });

  it("adds extra scroll between the first and second project card entry beats", () => {
    const firstRow = projectRowReveal({
      rowTop: 500,
      viewportHeight: 800,
      entryProgress: 0.72,
      headingProgress: 1,
      rowIndex: 0,
      rowCount: 9,
    });
    const secondRow = projectRowReveal({
      rowTop: 500,
      viewportHeight: 800,
      entryProgress: 0.72,
      headingProgress: 1,
      rowIndex: 1,
      rowCount: 9,
    });

    expect(firstRow).toBe(1);
    expect(secondRow).toBe(0);
  });

  it("keeps later project cards waiting until the first two-card intro sequence is complete", () => {
    expect(
      projectRowReveal({
        rowTop: 500,
        viewportHeight: 800,
        entryProgress: 0.9,
        headingProgress: 1,
        rowIndex: 2,
        rowCount: 9,
      }),
    ).toBe(0);
  });

  it("falls back to the original viewport reveal once entry sequencing is complete", () => {
    expect(
      projectRowReveal({
        rowTop: 500,
        viewportHeight: 800,
        entryProgress: 1,
        headingProgress: 1,
        rowIndex: 8,
        rowCount: 9,
      }),
    ).toBe(1);
  });
});
