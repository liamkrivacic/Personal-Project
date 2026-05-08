import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";

const scrollJourneySource = readFileSync(
  join(process.cwd(), "src", "components", "scroll-journey.tsx"),
  "utf8",
);

describe("project entry timing source", () => {
  it("uses the shared project-entry timing helper for background, heading, and card reveal variables", () => {
    expect(scrollJourneySource).toContain(
      'import { projectEntryTiming } from "@/lib/project-entry-timing";',
    );
    expect(scrollJourneySource).toContain(
      'import { nextVisualScrollY } from "@/lib/visual-scroll-smoothing";',
    );
    expect(scrollJourneySource).toContain("projectEntryTiming({");
    expect(scrollJourneySource).toContain("scrollY: visualScrollYRef.current");
    expect(scrollJourneySource).toContain("viewportHeight: vh");
    expect(scrollJourneySource).not.toContain("const bgFade = clamp01((y - 2.0 * vh)");
    expect(scrollJourneySource).not.toContain("const revealCol = smoothstep01((y - 2.0 * vh)");
  });

  it("keeps a frame loop running until smoothed visual scroll catches the real target", () => {
    expect(scrollJourneySource).toContain("visualScrollYRef.current = nextVisualScrollY({");
    expect(scrollJourneySource).toContain("targetY: targetScrollYRef.current");
    expect(scrollJourneySource).toContain("visualFrameRef.current = requestAnimationFrame(tickVisualScroll);");
  });

  it("notifies project rows after project entry timing variables change", () => {
    expect(scrollJourneySource).toContain(
      'window.dispatchEvent(new Event("project-entry-timing-update"));',
    );
  });
});
