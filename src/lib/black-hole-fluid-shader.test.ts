import { readFileSync } from "node:fs";
import { join } from "node:path";

import { describe, expect, it } from "vitest";

describe("black-hole fluid shader", () => {
  it("draws a lightweight star background without compiling legacy lensing passes", () => {
    const shaderSource = readFileSync(
      join(process.cwd(), "public", "black-hole-fluid", "fluid.js"),
      "utf8",
    );

    expect(shaderSource).toContain("float starGrid");
    expect(shaderSource).toContain("vec3 baseStarField");
    expect(shaderSource).toContain("vec2 viewToWorldUv");
    expect(shaderSource).toContain("float diveSurge");
    expect(shaderSource).toContain("float diveViolence");
    expect(shaderSource).toContain("float effectiveHorizon");
    expect(shaderSource).toContain("float horizonTremor");
    expect(shaderSource).toContain("float starFieldVisibility");
    expect(shaderSource).toContain("vec2 diveShake");
    expect(shaderSource).toContain("vec2 shakenUv = diveShake(vUv);");
    expect(shaderSource).toContain("vec2 worldUv = viewToWorldUv(rolledUv);");
    expect(shaderSource).toContain("color += baseStarField(worldUv) * starFieldVisibility();");
    expect(shaderSource).not.toContain("vec3 sampleLensedBackground");
    expect(shaderSource).not.toContain("vec3 sampleForegroundStars");
    expect(shaderSource).not.toContain("vec3 cursorLensField");
    expect(shaderSource).not.toContain("vec2 horizonParallaxUv");
    expect(shaderSource).not.toContain("vec2 warpBlackHoleField");
  });

  it("uses shadow-gated disk visibility and dedicated dive glow instead of a detached ribbon seam", () => {
    const shaderSource = readFileSync(
      join(process.cwd(), "public", "black-hole-fluid", "fluid.js"),
      "utf8",
    );

    expect(shaderSource).toContain("float shadowOcclusion");
    expect(shaderSource).toContain("float directDiskVisibility");
    expect(shaderSource).toContain("float upperLensedArc");
    expect(shaderSource).toContain("float lowerLensedArc");
    expect(shaderSource).toContain("vec3 sampleDiveGlow");
    expect(shaderSource).not.toContain("violence,\n  );");
    expect(shaderSource).not.toContain("float discRibbonCore");
    expect(shaderSource).not.toContain("float topWrap");
    expect(shaderSource).not.toContain("float wrapHalo");
    expect(shaderSource).not.toContain("float orbitD = mix(d, discD, discMix);");
    expect(shaderSource).not.toContain("vec2 ringAberrationOffset");
  });

  it("renders the black hole from a pseudo-3D ray-lensed accretion model", () => {
    const shaderSource = readFileSync(
      join(process.cwd(), "public", "black-hole-fluid", "fluid.js"),
      "utf8",
    );
    const heroSource = readFileSync(
      join(process.cwd(), "src", "components", "orbital", "orbital-hero.tsx"),
      "utf8",
    );
    const htmlSource = readFileSync(
      join(process.cwd(), "public", "black-hole-fluid", "index.html"),
      "utf8",
    );

    expect(shaderSource).toContain("struct AccretionField");
    expect(shaderSource).toContain("struct RayDiskHit");
    expect(shaderSource).toContain("RayDiskHit traceAccretionDisk");
    expect(shaderSource).toContain("float safeDenom");
    expect(shaderSource).toContain("t = clamp(t, -8.0, 8.0);");
    expect(shaderSource).toContain("AccretionField sampleRayLensedAccretion");
    expect(shaderSource).toContain("vec3 accretionColorRamp");
    expect(shaderSource).toContain("float shadowOcclusion");
    expect(shaderSource).toContain("float directDiskVisibility");
    expect(shaderSource).toContain("float upperLensedArc");
    expect(shaderSource).toContain("float lowerLensedArc");
    expect(shaderSource).toContain("float shadowRadius");
    expect(shaderSource).toContain("float photonRingRadius");
    expect(shaderSource).toContain("float diskOuterRadius");
    expect(shaderSource).toContain("float arcRadius = shadowRadius * mix(1.48, 1.62, sideView);");
    expect(shaderSource).toContain("float innerBridgeGlow");
    expect(shaderSource).toContain("float eventShadow = 1.0 - smoothstep(shadowRadius");
    expect(shaderSource).toContain("float restrainedPhotonRing");
    expect(shaderSource).toContain("float dopplerBeaming");
    expect(shaderSource).toContain("float eventShadow");
    expect(shaderSource).toContain("color = vec3(1.0) - exp(-color * mix(1.22, 1.66, surge));");
    expect(shaderSource).not.toContain("AccretionField sampleUnifiedAccretionField");
    expect(shaderSource).not.toContain("float cleanFade");
    expect(shaderSource).not.toContain("float warpedDisc");
    expect(shaderSource).not.toContain("float discBackscatter");
    expect(shaderSource).not.toContain("float wrappedDiscGlow");
    expect(shaderSource).not.toContain("float sideLane");
    expect(heroSource).toContain("scroll-dive-cinematic-17");
    expect(htmlSource).toContain("scroll-dive-cinematic-17");
    expect(heroSource).toContain('type: "black-hole-dive"');
    expect(heroSource).toContain('event.data.type !== "black-hole-dive-input"');
    expect(shaderSource).toContain('event.data.type !== "black-hole-dive"');
    expect(shaderSource).toContain('type: "black-hole-dive-input"');
  });

  it("keeps the photon ring and shadow anchored to the radial hole while the disc uses projected coordinates", () => {
    const shaderSource = readFileSync(
      join(process.cwd(), "public", "black-hole-fluid", "fluid.js"),
      "utf8",
    );

    expect(shaderSource).toContain("float eventShadow");
    expect(shaderSource).toContain("float shadowOcclusion");
    expect(shaderSource).toContain("float restrainedPhotonRing = exp(-pow((d - photonRingRadius)");
    expect(shaderSource).toContain("float photonRingRestraint");
    expect(shaderSource).toContain("float topBottomArcBias");
    expect(shaderSource).toContain("float sideLimbFusion");
    expect(shaderSource).toContain("RayDiskHit diskHit = traceAccretionDisk(uv);");
    expect(shaderSource).toContain("float directDiskVisibility = diskHit.visible * (1.0 - shadowOcclusion);");
    expect(shaderSource).not.toContain("float centerGap");
    expect(shaderSource).not.toContain(
      "float spiralMask = exp(-pow((orbitD - horizon * 2.22) / (horizon * 1.58), 2.0)) * (1.0 - hole);",
    );
    expect(shaderSource).not.toContain(
      "float warpedD = orbitD + (rimNoise - 0.5) * horizon * 0.095;",
    );
  });

  it("caps internal canvas resolution so the heavier lensing shader stays stable on wide screens", () => {
    const shaderSource = readFileSync(
      join(process.cwd(), "public", "black-hole-fluid", "fluid.js"),
      "utf8",
    );

    expect(shaderSource).toContain("const displayLimit = 800");
    expect(shaderSource).toContain("const displayScale = Math.min(");
    expect(shaderSource).toContain("width = Math.max(1, Math.floor(window.innerWidth * displayScale));");
    expect(shaderSource).toContain("height = Math.max(1, Math.floor(window.innerHeight * displayScale));");
    expect(shaderSource).toContain("const simulationLimit = 520");
    expect(shaderSource).toContain("const target = Math.min(simulationLimit");
  });
});
