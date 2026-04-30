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
    expect(shaderSource).toContain("vec2 warpedWorldUv = warpBlackHoleField(viewToWorldUv(rolledUv));");
    expect(shaderSource).toContain("vec2 worldUv = warpedWorldUv;");
    expect(shaderSource).toContain("color += sampleForegroundStars(worldUv);");
    expect(shaderSource).toContain("warpedUv += cursorLens.xy * 0.5;");
    expect(shaderSource).toContain("vec2 parallaxUv = horizonParallaxUv(uv, p, d);");
  });

  it("uses a soft side-view disc and a dedicated dive glow instead of the detached ribbon seam", () => {
    const shaderSource = readFileSync(
      join(process.cwd(), "public", "black-hole-fluid", "fluid.js"),
      "utf8",
    );

    expect(shaderSource).toContain("vec2 ringAberrationOffset");
    expect(shaderSource).toContain("float discBandSoftness");
    expect(shaderSource).toContain("float discDirectionalMask");
    expect(shaderSource).toContain("float discFieldBlend");
    expect(shaderSource).toContain("vec3 sampleDiveGlow");
    expect(shaderSource).not.toContain("violence,\n  );");
    expect(shaderSource).not.toContain("float discRibbonCore");
    expect(shaderSource).not.toContain("float topWrap");
    expect(shaderSource).not.toContain("float wrapHalo");
    expect(shaderSource).not.toContain("float orbitD = mix(d, discD, discMix);");
  });

  it("keeps the main halo and spiral field anchored to the radial hole instead of the side-view disc projection", () => {
    const shaderSource = readFileSync(
      join(process.cwd(), "public", "black-hole-fluid", "fluid.js"),
      "utf8",
    );

    expect(shaderSource).toContain(
      "float spiralMask = exp(-pow((d - horizon * 2.22) / (horizon * 1.58), 2.0)) * (1.0 - hole);",
    );
    expect(shaderSource).toContain(
      "float warpedD = d + (rimNoise - 0.5) * horizon * 0.095;",
    );
    expect(shaderSource).not.toContain(
      "float spiralMask = exp(-pow((orbitD - horizon * 2.22) / (horizon * 1.58), 2.0)) * (1.0 - hole);",
    );
    expect(shaderSource).not.toContain(
      "float warpedD = orbitD + (rimNoise - 0.5) * horizon * 0.095;",
    );
  });
});
