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
    expect(shaderSource).toContain("return mix(base, lensed, lensWeight);");
    expect(shaderSource).toContain("color += sampleForegroundStars(vUv);");
    expect(shaderSource).toContain("warpedUv += cursorLens.xy;");
    expect(shaderSource).toContain("vec2 parallaxUv = horizonParallaxUv(uv, p, d);");
  });
});
