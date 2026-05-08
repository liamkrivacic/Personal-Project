import { describe, expect, it } from "vitest";
import { projectEntryTiming } from "./project-entry-timing";

describe("projectEntryTiming", () => {
  const viewportHeight = 1000;

  function at(scrollViewportRatio: number) {
    return projectEntryTiming({
      scrollY: scrollViewportRatio * viewportHeight,
      viewportHeight,
    });
  }

  it("starts the project background wash before revealing the heading", () => {
    const timing = at(2.14);

    expect(timing.bgFade).toBeGreaterThan(0);
    expect(timing.revealCol).toBe(0);
    expect(timing.revealList).toBe(0);
  });

  it("lets the background wash finish before the project heading begins", () => {
    const timing = at(2.29);

    expect(timing.bgFade).toBe(1);
    expect(timing.revealCol).toBe(0);
    expect(timing.revealList).toBe(0);
  });

  it("reveals the heading before the project cards begin", () => {
    const timing = at(2.48);

    expect(timing.bgFade).toBe(1);
    expect(timing.revealCol).toBeGreaterThan(0);
    expect(timing.revealList).toBe(0);
  });

  it("starts project-card progress after the heading reveal is underway", () => {
    const timing = at(2.72);

    expect(timing.bgFade).toBe(1);
    expect(timing.revealCol).toBeGreaterThan(timing.revealList);
    expect(timing.revealList).toBeGreaterThan(0);
  });

  it("keeps card-reveal progress low for extra scroll after the heading has appeared", () => {
    const timing = at(3.0);

    expect(timing.revealCol).toBe(1);
    expect(timing.revealList).toBeLessThan(0.44);
  });
});
