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
    expect(scrollJourneySource).toContain("projectEntryTiming({");
    expect(scrollJourneySource).toContain("scrollY: y");
    expect(scrollJourneySource).toContain("viewportHeight: vh");
    expect(scrollJourneySource).not.toContain("const bgFade = clamp01((y - 2.0 * vh)");
    expect(scrollJourneySource).not.toContain("const revealCol = smoothstep01((y - 2.0 * vh)");
  });
});
