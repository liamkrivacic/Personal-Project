# Black Hole 3D Ray Shader Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Rebuild the black-hole display shader around real orbit-camera rays so cursor drag rotates through edge-on continuously while preserving cursor streamlets and scroll dive.

**Architecture:** Keep the existing WebGL canvas, iframe, advect shader, and streamlet simulation. Replace only the display shader's accretion-disc projection with an `OrbitCamera` basis, a bent camera ray, and an accretion-disc plane intersection that feed the existing Interstellar-style shadow, photon ring, disc, and lensed arc composition.

**Tech Stack:** Next.js 16, React 19, WebGL2 GLSL ES 3.00, Vitest string-architecture tests, Playwright runtime visual checks.

---

## File Map

- `public/black-hole-fluid/fluid.js`: Replace display-side disc projection helpers with camera-ray helpers; preserve advect shader and streamlet runtime.
- `public/black-hole-fluid/index.html`: Bump module cache key after shader changes.
- `src/components/orbital/orbital-hero.tsx`: Bump iframe cache key to match `index.html`.
- `src/lib/black-hole-fluid-shader.test.ts`: Add/adjust regression coverage for the real camera-ray architecture and preserved streamlet path.

## Task 1: Lock The Architecture With Failing Tests

**Files:**
- Modify: `src/lib/black-hole-fluid-shader.test.ts`

- [x] **Step 1: Update the shader architecture expectations**

Add expectations that require:

```ts
expect(shaderSource).toContain("struct OrbitCamera");
expect(shaderSource).toContain("OrbitCamera buildOrbitCamera(vec2 uv)");
expect(shaderSource).toContain("vec3 orbitCameraPosition()");
expect(shaderSource).toContain("vec3 bendRayTowardBlackHole(OrbitCamera camera, vec2 p)");
expect(shaderSource).toContain("RayDiskHit intersectAccretionDisc(OrbitCamera camera, vec3 rayDir)");
expect(shaderSource).toContain("RayDiskHit traceAccretionDisk(vec2 uv)");
expect(shaderSource).toContain("float signedCameraHeight");
expect(shaderSource).toContain("vec2 discCoord = hitPosition.xz * 0.36;");
expect(shaderSource).toContain("float nearSide = smoothstep(-0.08, 0.18, nearDepth);");
expect(shaderSource).not.toContain("float discTiltProjection()");
expect(shaderSource).not.toContain("float discScreenLift(float horizon, float sideView)");
expect(shaderSource).not.toContain("float orbitScreenPitchPhase()");
expect(shaderSource).not.toContain("vec2 bandP = rot(discSweepAngle()) * vec2(p.x, p.y - screenLift);");
```

- [x] **Step 2: Verify the new test fails**

Run:

```bash
npx vitest run src/lib/black-hole-fluid-shader.test.ts
```

Expected: FAIL because `OrbitCamera` and `intersectAccretionDisc` do not exist yet.

## Task 2: Implement The Real Orbit Camera And Ray-Disc Hit

**Files:**
- Modify: `public/black-hole-fluid/fluid.js`

- [x] **Step 1: Replace signed screen-projection helpers**

Remove these display-shader helpers:

```glsl
float orbitScreenPitchPhase()
float discTiltProjection()
float discScreenLift(float horizon, float sideView)
```

Keep `orbitFacingAmount`, `orbitSideAmount`, `orbitFacingSign`, and `orbitSignedVisualPhase` for lighting/depth.

- [x] **Step 2: Add the camera-ray helpers**

Add GLSL helpers near the orbit functions:

```glsl
struct OrbitCamera {
  vec3 origin;
  vec3 forward;
  vec3 right;
  vec3 up;
  vec3 rayDir;
  float inclination;
  float sideView;
};

float orbitCameraDistance() {
  return mix(2.82, 2.18, smoothstep(0.08, 0.72, diveProgress()));
}

vec3 orbitCameraPosition() {
  float yaw = diveAzimuth();
  float inclination = diveInclination();
  float radius = orbitCameraDistance();
  return vec3(
    sin(yaw) * sin(inclination),
    cos(inclination),
    cos(yaw) * sin(inclination)
  ) * radius;
}

OrbitCamera buildOrbitCamera(vec2 uv) {
  vec2 p = aspectPoint(uv);
  float yaw = diveAzimuth();
  float inclination = diveInclination();
  vec3 origin = orbitCameraPosition();
  vec3 forward = normalize(-origin);
  vec3 right = normalize(vec3(cos(yaw), 0.0, -sin(yaw)));
  vec3 up = normalize(cross(right, forward));
  float fov = mix(0.82, 1.08, discSideView());
  vec3 rayDir = normalize(forward + (p.x * right + p.y * up) * fov);
  return OrbitCamera(origin, forward, right, up, rayDir, inclination, discSideView());
}

vec3 bendRayTowardBlackHole(OrbitCamera camera, vec2 p) {
  float d = max(length(p), 0.018);
  float lensGate = 1.0 - smoothstep(0.05, 0.72, d);
  float sideLens = mix(0.035, 0.07, camera.sideView);
  vec3 toHole = normalize(-camera.origin);
  return normalize(camera.rayDir + toHole * sideLens * lensGate / (d + 0.16));
}
```

- [x] **Step 3: Add the disc intersection**

Add:

```glsl
RayDiskHit intersectAccretionDisc(OrbitCamera camera, vec3 rayDir) {
  float cameraSide = mix(-1.0, 1.0, step(0.0, camera.origin.y));
  float signedCameraHeight = cameraSide * max(abs(camera.origin.y), 0.075);
  vec3 rayOrigin = vec3(camera.origin.x, signedCameraHeight, camera.origin.z);
  float denomSign = mix(-1.0, 1.0, step(0.0, rayDir.y));
  float safeDenom = denomSign * max(abs(rayDir.y), 0.026);
  float t = -rayOrigin.y / safeDenom;
  float visible = step(0.0, t);
  t = clamp(t, 0.0, 8.0);
  vec3 hitPosition = rayOrigin + rayDir * t;
  vec2 discCoord = hitPosition.xz * 0.36;
  discCoord = clamp(discCoord, vec2(-2.2), vec2(2.2));
  vec2 cameraDiscDir = normalize(camera.origin.xz + vec2(0.0001, 0.0));
  float nearDepth = dot(hitPosition.xz * 0.36, cameraDiscDir);
  float nearSide = smoothstep(-0.08, 0.18, nearDepth);
  return RayDiskHit(
    discCoord,
    length(discCoord),
    atan(discCoord.y, discCoord.x),
    nearDepth,
    visible,
    nearSide
  );
}

RayDiskHit traceAccretionDisk(vec2 uv) {
  vec2 p = aspectPoint(uv);
  OrbitCamera camera = buildOrbitCamera(uv);
  vec3 rayDir = bendRayTowardBlackHole(camera, p);
  return intersectAccretionDisc(camera, rayDir);
}
```

- [x] **Step 4: Update side-band coordinates**

In `sampleRayLensedAccretion`, replace the old `screenLift`/`bandP` path with a camera-aware projection helper:

```glsl
vec2 bandP = projectedAccretionBand(uv);
```

Keep the existing `screenBand`, `foregroundBand`, and `sideWispTail` formulas so the Interstellar-style side band remains recognizable.

- [x] **Step 5: Verify the targeted test passes**

Run:

```bash
npx vitest run src/lib/black-hole-fluid-shader.test.ts
```

Expected: PASS.

## Task 3: Preserve Cursor Streamlets And Scroll Contract

**Files:**
- Modify: `src/lib/black-hole-fluid-shader.test.ts`
- Modify: `public/black-hole-fluid/fluid.js`

- [x] **Step 1: Keep streamlet coverage**

Ensure tests still assert:

```ts
expect(shaderSource).toContain("pushStreamPoint");
expect(shaderSource).toContain("updateStreamlets(dt, now / 1000)");
expect(shaderSource).toContain("wavefrontSource(vUv)");
expect(shaderSource).toContain("uniform4fv(displayProgram, \"uStreamMeta\", streamMetaUniforms);");
expect(shaderSource).toContain("uniform4fv(displayProgram, \"uStreamWave\", streamWaveUniforms);");
```

- [x] **Step 2: Keep scroll contract coverage**

Ensure tests still assert:

```ts
expect(heroSource).toContain('type: "black-hole-dive"');
expect(heroSource).toContain('event.data.type !== "black-hole-dive-input"');
expect(shaderSource).toContain('event.data.type !== "black-hole-dive"');
expect(shaderSource).toContain('type: "black-hole-dive-input"');
```

## Task 4: Cache Version And Runtime Visual Checks

**Files:**
- Modify: `public/black-hole-fluid/index.html`
- Modify: `src/components/orbital/orbital-hero.tsx`
- Modify: `src/lib/black-hole-fluid-shader.test.ts`

- [x] **Step 1: Bump cache key**

Use:

```txt
scroll-dive-cinematic-28
```

in both iframe and script URLs, and update tests accordingly.

- [x] **Step 2: Capture visual screenshots**

Run a Playwright/Chrome script to capture:

```txt
.verification/ray-camera-v28-final-chrome-00-idle.png
.verification/ray-camera-v28-final-chrome-01-scroll-side-view.png
.verification/ray-camera-v28-final-chrome-02-up-before-edge.png
.verification/ray-camera-v28-final-chrome-03-up-after-edge.png
.verification/ray-camera-v28-final-chrome-04-up-continuing.png
.verification/ray-camera-v28-final-chrome-05-streamlet-decay-after-drag.png
```

Expected: the canvas is nonblank, the disc remains black-hole-like, and drag through edge-on does not visually bounce.

## Task 5: Full Verification

Status: completed.

Run:

```bash
npm test
npm run lint
npm run build
npm run test:fluid
git diff --check
```

Expected:
- Vitest passes.
- ESLint passes.
- Next build passes.
- Playwright passes.
- `git diff --check` has no whitespace errors. Existing Git CRLF warnings are acceptable.
