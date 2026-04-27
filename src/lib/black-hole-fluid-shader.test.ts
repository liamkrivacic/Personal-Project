import { readFileSync } from "node:fs";
import { join } from "node:path";

import { describe, expect, it } from "vitest";

describe("black-hole fluid shader", () => {
  it("lenses a normal star background instead of drawing pre-stretched stars", () => {
    const shaderSource = readFileSync(
      join(process.cwd(), "public", "black-hole-fluid", "fluid.js"),
      "utf8",
    );

    expect(shaderSource).toContain("float starGrid");
    expect(shaderSource).toContain("vec3 baseStarField");
    expect(shaderSource).toContain("vec3 sampleLensedBackground");
    expect(shaderSource).toContain("vec3 sampleForegroundStars");
    expect(shaderSource).toContain("vec3 cursorLensField");
    expect(shaderSource).toContain("vec2 horizonParallaxUv");
    expect(shaderSource).toContain("vec2 viewToWorldUv");
    expect(shaderSource).toContain("float diveSurge");
    expect(shaderSource).toContain("float diveViolence");
    expect(shaderSource).toContain("float effectiveHorizon");
    expect(shaderSource).toContain("float horizonTremor");
    expect(shaderSource).toContain("float starFieldVisibility");
    expect(shaderSource).toContain("vec2 diveShake");
    expect(shaderSource).toContain("vec2 warpBlackHoleField");
    expect(shaderSource).toContain("return mix(base, lensed * visible, lensWeight);");
    expect(shaderSource).toContain("vec2 shakenUv = diveShake(vUv);");
    expect(shaderSource).toContain("vec2 warpedWorldUv = warpBlackHoleField(viewToWorldUv(shakenUv));");
    expect(shaderSource).toContain("vec2 worldUv = warpedWorldUv;");
    expect(shaderSource).toContain("color += sampleForegroundStars(worldUv);");
    expect(shaderSource).toContain("warpedUv += cursorLens.xy;");
    expect(shaderSource).toContain("vec2 parallaxUv = horizonParallaxUv(uv, p, d);");
  });
});
