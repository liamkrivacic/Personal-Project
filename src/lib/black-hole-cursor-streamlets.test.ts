import { readFileSync } from "node:fs";
import { join } from "node:path";

import { describe, expect, it } from "vitest";

const cursorOverlaySource = readFileSync(
  join(process.cwd(), "public", "black-hole-cursor-streamlets", "fluid.js"),
  "utf8",
);

describe("black-hole cursor streamlets", () => {
  it("keeps the cursor wavefront width from expanding as streamlets age", () => {
    expect(cursorOverlaySource).not.toMatch(/streamlet\.waveWidth\s*\+=/);
    expect(cursorOverlaySource).not.toMatch(
      /streamlet\.waveWidth\s*=\s*streamlet\.waveWidth\s*\+/,
    );
  });

  it("lets wavefront width follow current cursor velocity instead of only increasing", () => {
    expect(cursorOverlaySource).toContain("function wavefrontWidthForIntensity(intensity) {");
    expect(cursorOverlaySource).toContain("return 0.064 + intensity * 0.032;");
    expect(cursorOverlaySource).toContain(
      "streamlet.waveWidth = wavefrontWidthForIntensity(intensity);",
    );
    expect(cursorOverlaySource).toContain("waveWidth: wavefrontWidthForIntensity(intensity),");
    expect(cursorOverlaySource).not.toContain("Math.max(streamlet.waveWidth");
  });

  it("preserves cursor-speed brightness for the wavefront", () => {
    expect(cursorOverlaySource).toContain(
      "const speedIntensity = clamp((speed - 0.035) / 0.95, 0, 1);",
    );
    expect(cursorOverlaySource).toContain(
      "const emissionIntensity = intensity * emissionStrength * outerBoost;",
    );
    expect(cursorOverlaySource).toContain(
      "streamlet.waveStrength = Math.max(streamlet.waveStrength, 0.14 + intensity * 0.22);",
    );
    expect(cursorOverlaySource).toContain("waveStrength: 0.24 + intensity * 0.32,");
  });
});
