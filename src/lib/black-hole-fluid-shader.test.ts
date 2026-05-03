import { readFileSync } from "node:fs";
import { join } from "node:path";

import { describe, expect, it } from "vitest";

describe("black-hole fluid shader", () => {
  it("documents that camera angles are not separate black-hole rendering modes", () => {
    const codexNotes = readFileSync(join(process.cwd(), "CODEX.md"), "utf8");

    expect(codexNotes).toContain("one canonical accretion model");
    expect(codexNotes).toContain("must not become separate shader modes");
    expect(codexNotes).toContain("Camera angle may change projection");
    expect(codexNotes).toContain("Camera angle must not change the identity of the rim");
    expect(codexNotes).toContain("ray-disc intersection coordinates");
    expect(codexNotes).toContain("Projected edge-on bands may shape visibility");
    expect(codexNotes).toContain("must not define the spiral radius or angle");
  });

  it("draws a lightweight star background without compiling legacy lensing passes", () => {
    const shaderSource = readFileSync(
      join(process.cwd(), "public", "black-hole-fluid", "fluid.js"),
      "utf8",
    );

    expect(shaderSource).toContain("float starGrid");
    expect(shaderSource).toContain("vec3 baseStarField");
    expect(shaderSource).toContain("uniform vec4 uDragOrbit;");
    expect(shaderSource).toContain("vec2 dragOrbitStarUv");
    expect(shaderSource).toContain("vec2 viewToWorldUv");
    expect(shaderSource).toContain("float diveSurge");
    expect(shaderSource).toContain("float diveViolence");
    expect(shaderSource).toContain("float effectiveHorizon");
    expect(shaderSource).toContain("float horizonTremor");
    expect(shaderSource).toContain("float starFieldVisibility");
    expect(shaderSource).toContain("vec2 diveShake");
    expect(shaderSource).toContain("vec2 shakenUv = diveShake(vUv);");
    expect(shaderSource).toContain("vec2 worldUv = viewToWorldUv(rolledUv);");
    expect(shaderSource).toContain("vec2 starUv = dragOrbitStarUv(worldUv);");
    expect(shaderSource).toContain("color += baseStarField(starUv) * starFieldVisibility();");
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
    expect(shaderSource).toContain("float unifiedWrapRing");
    expect(shaderSource).toContain("float lensedDiscWrap");
    expect(shaderSource).toContain("float strongOuterSwirl");
    expect(shaderSource).toContain("float swirlReach");
    expect(shaderSource).toContain("vec3 sampleDiveGlow");
    expect(shaderSource).not.toContain("violence,\n  );");
    expect(shaderSource).not.toContain("float discRibbonCore");
    expect(shaderSource).not.toContain("float topWrap");
    expect(shaderSource).not.toContain("float wrapHalo");
    expect(shaderSource).not.toContain("float orbitD = mix(d, discD, discMix);");
    expect(shaderSource).not.toContain("vec2 ringAberrationOffset");
  });

  it("renders the black hole from a real orbit-camera ray accretion model", () => {
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
    expect(shaderSource).toContain("struct OrbitCamera");
    expect(shaderSource).toContain("OrbitCamera buildOrbitCamera(vec2 uv)");
    expect(shaderSource).toContain("vec3 orbitCameraPosition()");
    expect(shaderSource).toContain("vec3 bendRayTowardBlackHole(OrbitCamera camera, vec2 p)");
    expect(shaderSource).toContain("RayDiskHit intersectAccretionDisc(OrbitCamera camera, vec3 rayDir)");
    expect(shaderSource).toContain("RayDiskHit traceAccretionDisk");
    expect(shaderSource).toContain("float safeDenom");
    expect(shaderSource).toContain("float signedCameraHeight");
    expect(shaderSource).toContain("vec2 discCoord = hitPosition.xz * 0.36;");
    expect(shaderSource).toContain("float nearSide = smoothstep(-0.08, 0.18, nearDepth);");
    expect(shaderSource).toContain("t = clamp(t, 0.0, 8.0);");
    expect(shaderSource).toContain("AccretionField sampleRayLensedAccretion");
    expect(shaderSource).toContain("vec3 accretionColorRamp");
    expect(shaderSource).toContain("float shadowOcclusion");
    expect(shaderSource).toContain("float directDiskVisibility");
    expect(shaderSource).toContain("struct UnifiedDiscField");
    expect(shaderSource).toContain("UnifiedDiscField sampleUnifiedDiscField(vec2 uv)");
    expect(shaderSource).toContain("float shadowRadius");
    expect(shaderSource).toContain("float photonRingRadius");
    expect(shaderSource).toContain("const float CANONICAL_SHADOW_SCALE = 0.74;");
    expect(shaderSource).toContain("const float CANONICAL_PHOTON_RADIUS = 1.04;");
    expect(shaderSource).toContain("const float CANONICAL_LENS_WRAP_RADIUS = 1.56;");
    expect(shaderSource).toContain("const float CANONICAL_DISC_INNER_RADIUS = 1.16;");
    expect(shaderSource).toContain("const float CANONICAL_DISC_OUTER_RADIUS = 5.4;");
    expect(shaderSource).toContain("vec2 canonicalDiscCoord = diskHit.coord;");
    expect(shaderSource).toContain("float swirlReach = shadowRadius * 6.8;");
    expect(shaderSource).toContain("float innerBridgeGlow");
    expect(shaderSource).toContain("float eventShadow = 1.0 - smoothstep(shadowRadius");
    expect(shaderSource).toContain("float unifiedPhotonRing");
    expect(shaderSource).toContain("float unifiedWrapRing");
    expect(shaderSource).toContain("float lensedDiscWrap");
    expect(shaderSource).toContain("float strongOuterSwirl");
    expect(shaderSource).not.toContain("float flattenedArcDistance");
    expect(shaderSource).not.toContain("float layeredArcFilaments");
    expect(shaderSource).not.toContain("float equatorialCaustic");
    expect(shaderSource).not.toContain("float horseshoeArcShelf");
    expect(shaderSource).toContain("float dopplerBeaming");
    expect(shaderSource).toContain("float eventShadow");
    expect(shaderSource).toContain("color = vec3(1.0) - exp(-color * mix(1.22, 1.66, surge));");
    expect(shaderSource).not.toContain("AccretionField sampleUnifiedAccretionField");
    expect(shaderSource).not.toContain("float cleanFade");
    expect(shaderSource).not.toContain("float warpedDisc");
    expect(shaderSource).not.toContain("float discBackscatter");
    expect(shaderSource).not.toContain("float wrappedDiscGlow");
    expect(shaderSource).not.toContain("float sideLane");
    expect(heroSource).toContain("scroll-dive-cinematic-37");
    expect(htmlSource).toContain("scroll-dive-cinematic-37");
    expect(heroSource).toContain('type: "black-hole-dive"');
    expect(heroSource).toContain('event.data.type !== "black-hole-dive-input"');
    expect(shaderSource).toContain('event.data.type !== "black-hole-dive"');
    expect(shaderSource).toContain('type: "black-hole-dive-input"');
    expect(shaderSource).toContain("pushStreamPoint");
    expect(shaderSource).toContain("updateStreamlets(dt, now / 1000)");
    expect(shaderSource).toContain("wavefrontSource(vUv)");
    expect(shaderSource).toContain('uniform4fv(displayProgram, "uStreamMeta", streamMetaUniforms);');
    expect(shaderSource).toContain('uniform4fv(displayProgram, "uStreamWave", streamWaveUniforms);');
  });

  it("supports click-drag orbit controls with first-load tilt and globe-style momentum", () => {
    const shaderSource = readFileSync(
      join(process.cwd(), "public", "black-hole-fluid", "fluid.js"),
      "utf8",
    );

    expect(shaderSource).toContain("const dragOrbit = {");
    expect(shaderSource).toContain("targetYaw");
    expect(shaderSource).toContain("targetPitch");
    expect(shaderSource).toContain("velocityYaw");
    expect(shaderSource).toContain("velocityPitch");
    expect(shaderSource).toContain("engagement");
    expect(shaderSource).toContain("function updateDragOrbit");
    expect(shaderSource).toContain('canvas.addEventListener("pointerdown"');
    expect(shaderSource).toContain('canvas.addEventListener("pointerup"');
    expect(shaderSource).toContain('canvas.addEventListener("pointercancel"');
    expect(shaderSource).toContain("canvas.setPointerCapture(event.pointerId);");
    expect(shaderSource).toContain("canvas.addEventListener(\"pointermove\", (event) => {\n  updateDragOrbit(event);");
    expect(shaderSource).not.toContain("if (updateDragOrbit(event)) {\n    return;\n  }");
    expect(shaderSource).toContain("const yawDelta = dx * 4.8;");
    expect(shaderSource).toContain("dragOrbit.velocityYaw = yawDelta / elapsed;");
    expect(shaderSource).toContain("const pitchDelta = dy * 3.4;");
    expect(shaderSource).toContain("dragOrbit.targetPitch += pitchDelta;");
    expect(shaderSource).not.toContain("dragOrbit.targetPitch = clamp(dragOrbit.targetPitch + pitchDelta");
    expect(shaderSource).toContain("dragOrbit.targetYaw += dragOrbit.velocityYaw * dt;");
    expect(shaderSource).toContain("dragOrbit.targetPitch += dragOrbit.velocityPitch * dt;");
    expect(shaderSource).not.toContain("dragOrbit.targetPitch += (0 - dragOrbit.targetPitch)");
    expect(shaderSource).toContain("dragOrbit.velocityYaw *= Math.exp(-dt * 1.45);");
    expect(shaderSource).toContain("const engagementFollow = 1 - Math.exp(-dt * 4.6);");
    expect(shaderSource).toContain("dragOrbit.yaw += (dragOrbit.targetYaw - dragOrbit.yaw) * orbitFollow;");
    expect(shaderSource).toContain("dragOrbit.pitch += (dragOrbit.targetPitch - dragOrbit.pitch) * orbitFollow;");
    expect(shaderSource).toContain('uniform4f(displayProgram, "uDragOrbit", dragOrbit.yaw, dragOrbit.pitch, dragOrbit.spinSpeed, dragOrbit.engagement);');
    expect(shaderSource).toContain("float dragPitch = uDragOrbit.y;");
    expect(shaderSource).toContain("float dragEnergy = uDragOrbit.w;");
    expect(shaderSource).toContain("float dragLift = dragEnergy * (0.18 + uDragOrbit.z * 0.08);");
    expect(shaderSource).toContain("return baseInclination + dragPitch * 1.0 + dragLift;");
    expect(shaderSource).toContain("float orbitFacingAmount()");
    expect(shaderSource).toContain("return cos(diveInclination());");
    expect(shaderSource).toContain("float orbitSideAmount()");
    expect(shaderSource).toContain("return abs(sin(diveInclination()));");
    expect(shaderSource).toContain("float orbitFacingSign()");
    expect(shaderSource).toContain("return mix(-1.0, 1.0, step(0.0, orbitFacingAmount()));");
    expect(shaderSource).toContain("float orbitSignedVisualPhase()");
    expect(shaderSource).toContain("return clamp(orbitFacingAmount() / 0.32, -1.0, 1.0);");
    expect(shaderSource).toContain("struct OrbitCamera");
    expect(shaderSource).toContain("vec3 orbitCameraPosition()");
    expect(shaderSource).toContain("OrbitCamera buildOrbitCamera(vec2 uv)");
    expect(shaderSource).toContain("vec3 rayDir = normalize(forward + (p.x * right + p.y * up) * fov);");
    expect(shaderSource).toContain("RayDiskHit intersectAccretionDisc(OrbitCamera camera, vec3 rayDir)");
    expect(shaderSource).toContain("float signedCameraHeight");
    expect(shaderSource).toContain("vec2 discCoord = hitPosition.xz * 0.36;");
    expect(shaderSource).toContain("float nearSide = smoothstep(-0.08, 0.18, nearDepth);");
    expect(shaderSource).not.toContain("float orbitScreenPitchPhase()");
    expect(shaderSource).not.toContain("float discTiltProjection()");
    expect(shaderSource).not.toContain("return discTiltCompression() * orbitFacingSign();");
    expect(shaderSource).not.toContain("float discScreenLift(float horizon, float sideView)");
    expect(shaderSource).not.toContain("float orbitHemisphere()");
    expect(shaderSource).toContain("return smoothstep(0.18, 0.98, orbitSideAmount());");
    expect(shaderSource).toContain("OrbitCamera camera = buildOrbitCamera(uv);");
    expect(shaderSource).toContain("vec3 rayDir = bendRayTowardBlackHole(camera, p);");
    expect(shaderSource).not.toContain("* hemisphere) / tiltProjection");
    expect(shaderSource).toContain("float orbitVisualPhase = orbitSignedVisualPhase();");
    expect(shaderSource).toContain("vec2 bandP = projectedAccretionBand(uv);");
    expect(shaderSource).not.toContain("vec2 bandP = rot(discSweepAngle()) * p;");
    expect(shaderSource).not.toContain("vec2 bandP = rot(discSweepAngle()) * vec2(p.x, p.y - screenLift);");
    expect(shaderSource).not.toContain("vec2 bandP = rot(discSweepAngle()) * vec2(p.x, p.y * orbitVisualPhase);");
    expect(shaderSource).toContain("cos(diskHit.angle - diveAzimuth()) * orbitVisualPhase");
    expect(shaderSource).toContain("return uDragOrbit.x;");
    expect(shaderSource).toContain("return uDragOrbit.x * mix(0.34, 0.18, discSideView());");
    expect(shaderSource).toContain("float starCameraParallax");
    expect(shaderSource).toContain("vec2 cameraLookOffset");
    expect(shaderSource).toContain("vec2 perspectiveShear");
    expect(shaderSource).toContain("float verticalLookTravel = -pitch * 1.18;");
    expect(shaderSource).not.toContain("pitch * 0.72");
    expect(shaderSource).not.toContain("pitch * parallax * 0.72");
    expect(shaderSource).toContain("function uniform4f(program, name, x, y, z, w)");
    expect(shaderSource).not.toContain("abs(sin(uDragOrbit.x))");
    expect(shaderSource).not.toContain("return smoothstep(0.18, 0.98, abs(sin(diveInclination())));");
    expect(shaderSource).not.toContain("return max(abs(cos(diveInclination())), 0.12);");
  });

  it("uses one canonical Interstellar-style accretion model instead of top/side visual modes", () => {
    const shaderSource = readFileSync(
      join(process.cwd(), "public", "black-hole-fluid", "fluid.js"),
      "utf8",
    );
    const fieldStart = shaderSource.indexOf("UnifiedDiscField sampleUnifiedDiscField");
    const fieldEnd = shaderSource.indexOf("AccretionField sampleRayLensedAccretion", fieldStart);
    const unifiedFieldBlock = shaderSource.slice(fieldStart, fieldEnd);

    expect(shaderSource).toContain("struct UnifiedDiscField");
    expect(shaderSource).toContain("UnifiedDiscField sampleUnifiedDiscField(vec2 uv)");
    expect(shaderSource).toContain("Canonical single-model rule");
    expect(shaderSource).toContain("float discFilaments");
    expect(shaderSource).toContain("vec2 canonicalDiscCoord = diskHit.coord;");
    expect(shaderSource).toContain("float canonicalDiscRadius");
    expect(shaderSource).toContain("float canonicalDiscAngle");
    expect(shaderSource).toContain("float swirlReach = shadowRadius * 6.8;");
    expect(shaderSource).toContain("float strongOuterSwirl");
    expect(shaderSource).toContain("float outerAccretionEnvelope");
    expect(shaderSource).toContain("float discSpiralPhase");
    expect(shaderSource).toContain("float discSpiralBand");
    expect(shaderSource).toContain("float canonicalSpiralArm");
    expect(shaderSource).toContain("float unifiedPhotonRing");
    expect(shaderSource).toContain("float unifiedWrapRing");
    expect(shaderSource).toContain("float lensedEnvelope");
    expect(shaderSource).toContain("UnifiedDiscField unified = sampleUnifiedDiscField(uv);");
    expect(shaderSource).toContain("unified.strongOuterSwirl");
    expect(shaderSource).toContain("unified.unifiedWrapRing");
    expect(shaderSource).toContain("unified.unifiedPhotonRing");
    expect(shaderSource).not.toContain("spiralArmContrast");
    expect(shaderSource).not.toContain("interArmDarkness");
    expect(unifiedFieldBlock).not.toContain("float sideView = discSideView();");
    expect(unifiedFieldBlock).not.toContain("sideView");
    expect(unifiedFieldBlock).toContain("projectedAccretionBand");
    expect(unifiedFieldBlock).toContain("traceAccretionDisk");
    expect(unifiedFieldBlock).toContain("vec2 canonicalDiscCoord = diskHit.coord;");
    expect(unifiedFieldBlock).toContain("float canonicalDiscRadius = diskHit.radius;");
    expect(unifiedFieldBlock).toContain("float canonicalDiscAngle = diskHit.angle;");
    expect(unifiedFieldBlock).toContain("float canonicalSpiralArm = smoothstep(0.16, 0.95, discSpiralBand);");
    expect(unifiedFieldBlock).toContain("float projectedDiscPlane");
    expect(unifiedFieldBlock).toContain("float projectedDiscCue");
    expect(unifiedFieldBlock).toContain("float shadowRadius = horizon * CANONICAL_SHADOW_SCALE * diveShrink;");
    expect(unifiedFieldBlock).toContain("float photonRingRadius = shadowRadius * CANONICAL_PHOTON_RADIUS;");
    expect(unifiedFieldBlock).toContain("float lensWrapRadius = shadowRadius * CANONICAL_LENS_WRAP_RADIUS;");
    expect(unifiedFieldBlock).toContain("float diskInnerRadius = shadowRadius * CANONICAL_DISC_INNER_RADIUS;");
    expect(unifiedFieldBlock).toContain("float compactDiscOuterRadius = shadowRadius * CANONICAL_DISC_OUTER_RADIUS;");
    expect(shaderSource).not.toContain("float discPlaneCore = sideView *");
    expect(shaderSource).not.toContain("float innerHorizontalRim = sideView *");
    expect(shaderSource).not.toContain("float alignedOuterDiscTail = sideView *");
    expect(shaderSource).not.toContain("float topViewOuterRing =");
    expect(shaderSource).not.toContain("float horizontalDiscBand");
    expect(shaderSource).not.toContain("float sideViewBeam");
    expect(unifiedFieldBlock).not.toContain("float cameraDiscBlend");
    expect(unifiedFieldBlock).not.toContain("mix(diskHit.radius, projectedRadius");
    expect(unifiedFieldBlock).not.toContain("mix(diskDir, projectedDir");
    expect(unifiedFieldBlock).not.toContain("float radialDiscGate");
    expect(unifiedFieldBlock).not.toContain("float radialDiscEmission");
    expect(unifiedFieldBlock).not.toContain("mix(radialDiscGate, projectedRadialGate");
    expect(unifiedFieldBlock).not.toContain("diskEmission = mix(");
    expect(unifiedFieldBlock).not.toContain("canonicalDiscProjectionBlend");
    expect(unifiedFieldBlock).not.toContain("vec2 canonicalDiscP = vec2(bandP.x");
    expect(unifiedFieldBlock).not.toContain("float canonicalDiscRadius = length(canonicalDiscP);");
    expect(unifiedFieldBlock).not.toContain("float canonicalDiscAngle = atan(canonicalDiscP.y, canonicalDiscP.x);");
    expect(shaderSource).not.toContain("discColor * alignedOuterDiscTail * sideViewBeam");
    expect(shaderSource).not.toContain("float sideWispTail = sideView *");
    expect(shaderSource).not.toContain("samplePhotonRingCrescendo");
    expect(shaderSource).not.toContain("vec3 photonColor = mix(vec3(1.0, 0.97, 0.92)");
    expect(shaderSource).not.toContain("vec3 horizonColor = vec3(0.84, 0.92, 1.0);");
    expect(shaderSource).not.toContain("float whitening = diveDepth");
  });

  it("keeps the strong outer swirl hazy without side-view brightness multipliers", () => {
    const shaderSource = readFileSync(
      join(process.cwd(), "public", "black-hole-fluid", "fluid.js"),
      "utf8",
    );

    const fieldStart = shaderSource.indexOf("UnifiedDiscField sampleUnifiedDiscField");
    const fieldEnd = shaderSource.indexOf("AccretionField sampleRayLensedAccretion", fieldStart);
    const unifiedFieldBlock = shaderSource.slice(fieldStart, fieldEnd);

    expect(shaderSource).toContain("float strongOuterSwirl");
    expect(shaderSource).toContain("float discSpiralBand");
    expect(shaderSource).toContain("float canonicalSpiralArm");
    expect(shaderSource).toContain("float swirlRadialGate");
    expect(shaderSource).toContain("float lensedDiscWrap");
    expect(shaderSource).toContain(
      "float strongOuterSwirl =",
    );
    expect(shaderSource).toContain(
      "swirlColor * strongOuterSwirl",
    );
    expect(unifiedFieldBlock).toContain("outerAccretionEnvelope");
    expect(unifiedFieldBlock).toContain("discSpiralBand");
    expect(unifiedFieldBlock).toContain("float discSpiralBand = pow(0.5 + 0.5 * cos(discSpiralPhase * 2.0), 4.0);");
    expect(unifiedFieldBlock).toContain("(0.06 + canonicalSpiralArm * 0.54 + shearNoise * 0.05)");
    expect(unifiedFieldBlock).toContain("swirlColor * strongOuterSwirl * 1.08");
    expect(unifiedFieldBlock).toContain("lensedDiscWrap");
    expect(unifiedFieldBlock).not.toContain("mix(0.24, 1.0, smoothstep(0.28, 1.0, discSpiralBand))");
    expect(unifiedFieldBlock).not.toContain("canonicalSpiralArm * 1.34");
    expect(unifiedFieldBlock).not.toContain("swirlColor * strongOuterSwirl * 1.46");
    expect(unifiedFieldBlock).not.toContain("smoothstep(0.34, 1.0, discSpiralBand)");
    expect(unifiedFieldBlock).not.toContain("(0.42 + sideView * 0.38)");
    expect(unifiedFieldBlock).not.toContain("mix(0.68, 0.74, sideView)");
    expect(unifiedFieldBlock).not.toContain("mix(1.42, 1.56, sideView)");
    expect(unifiedFieldBlock).not.toContain("mix(1.1, 1.16, sideView)");
    expect(unifiedFieldBlock).not.toContain("mix(4.4, 5.4, sideView)");
    expect(unifiedFieldBlock).not.toContain("mix(1.02, 0.72, sideView)");
    expect(unifiedFieldBlock).not.toContain("shadowRadius * mix(0.058, 0.074, sideView)");
    expect(unifiedFieldBlock).not.toContain("mix(1.0, 0.32, sideView)");
    expect(unifiedFieldBlock).not.toContain("(0.46 + sideView * 0.72)");
    expect(unifiedFieldBlock).not.toContain("(0.05 + sideView * 0.16)");
    expect(unifiedFieldBlock).not.toContain("(0.18 + sideView * 0.72)");
    expect(unifiedFieldBlock).not.toContain("0.72 + sideView * 0.08");
    expect(unifiedFieldBlock).not.toContain("1.1 + sideView * 0.12");
    expect(unifiedFieldBlock).not.toContain("spiralArmContrast");
    expect(unifiedFieldBlock).not.toContain("interArmDarkness");
  });

  it("keeps the photon ring and shadow anchored to the radial hole while the disc uses ray-disc coordinates", () => {
    const shaderSource = readFileSync(
      join(process.cwd(), "public", "black-hole-fluid", "fluid.js"),
      "utf8",
    );

    expect(shaderSource).toContain("float eventShadow");
    expect(shaderSource).toContain("float shadowOcclusion");
    expect(shaderSource).toContain("float unifiedPhotonRing = exp(-pow((d - photonRingRadius)");
    expect(shaderSource).toContain("float photonRingRestraint");
    expect(shaderSource).toContain("float unifiedWrapRing");
    expect(shaderSource).toContain("float lensedDiscWrap");
    expect(shaderSource).toContain("float strongOuterSwirl");
    expect(shaderSource).toContain("float directDiskVisibility = diskHit.visible * outsideShadow * (1.0 - shadowOcclusion * 0.35);");
    expect(shaderSource).toContain("float spiralVisibility = max(directDiskVisibility * nearSideVisibility, projectedDiscCue * 0.24);");
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
