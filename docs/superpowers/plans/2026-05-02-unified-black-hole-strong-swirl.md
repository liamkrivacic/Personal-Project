# Unified Black Hole Strong Swirl Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace side-only black-hole visual layers with one unified accretion-disc field and restore a strong chapter 8/9-style orange swirl.

**Architecture:** Keep the current WebGL runtime, orbit camera, ray-disc intersection, cursor streamlets, and iframe scroll contract. Refactor only the display shader composition so top, tilted, and side views all draw from one `UnifiedDiscField` that includes direct disc material, strong outer swirl, photon ring, and lensed wrap.

**Tech Stack:** Next.js 16, React 19, WebGL2 GLSL ES 3.00, Vitest shader source tests, Playwright/Chrome visual captures.

---

## File Map

- `public/black-hole-fluid/fluid.js`: Add unified accretion field and remove v29 side-only display layers.
- `public/black-hole-fluid/index.html`: Bump runtime cache key to `scroll-dive-cinematic-30`.
- `src/components/orbital/orbital-hero.tsx`: Bump iframe cache key to `scroll-dive-cinematic-30`.
- `src/lib/black-hole-fluid-shader.test.ts`: Add regression tests for unified field and strong swirl.

## Task 1: Lock Unified Shader Contract With Failing Tests

**Files:**
- Modify: `src/lib/black-hole-fluid-shader.test.ts`

- [ ] **Step 1: Add a regression test for the unified model**

Add a test that requires:

```ts
expect(shaderSource).toContain("struct UnifiedDiscField");
expect(shaderSource).toContain("UnifiedDiscField sampleUnifiedDiscField(vec2 uv)");
expect(shaderSource).toContain("float strongOuterSwirl");
expect(shaderSource).toContain("float unifiedWrapRing");
expect(shaderSource).toContain("float unifiedPhotonRing");
expect(shaderSource).toContain("float discPerspective = mix(1.0, 0.46, sideView);");
expect(shaderSource).toContain("float swirlReach = shadowRadius * mix(4.2, 7.4, sideView);");
expect(shaderSource).not.toContain("float discPlaneCore = sideView *");
expect(shaderSource).not.toContain("float innerHorizontalRim = sideView *");
expect(shaderSource).not.toContain("float alignedOuterDiscTail = sideView *");
expect(shaderSource).not.toContain("float topViewOuterRing =");
expect(shaderSource).not.toContain("discColor * alignedOuterDiscTail * sideViewBeam");
```

- [ ] **Step 2: Update cache expectations**

Change the expected cache key from `scroll-dive-cinematic-29` to `scroll-dive-cinematic-30`.

- [ ] **Step 3: Verify red**

Run:

```powershell
npx vitest run src/lib/black-hole-fluid-shader.test.ts
```

Expected: FAIL because `UnifiedDiscField`, `strongOuterSwirl`, and `scroll-dive-cinematic-30` are not implemented yet.

## Task 2: Implement Unified Accretion Field

**Files:**
- Modify: `public/black-hole-fluid/fluid.js`

- [ ] **Step 1: Add unified field struct**

Add near `AccretionField` and `RayDiskHit`:

```glsl
struct UnifiedDiscField {
  vec3 discColor;
  float directDisc;
  float strongOuterSwirl;
  float unifiedPhotonRing;
  float unifiedWrapRing;
  float lensedEnvelope;
  float eventShadow;
};
```

- [ ] **Step 2: Replace side-only terms in `sampleRayLensedAccretion`**

Remove the v29 terms:

```glsl
float discPlaneCore = sideView *
float innerHorizontalRim = sideView *
float alignedOuterDiscTail = sideView *
float topViewOuterRing =
```

Add `sampleUnifiedDiscField(vec2 uv)` that uses `traceAccretionDisk(uv)`, `projectedAccretionBand(uv)`, and one disc-coordinate spiral:

```glsl
float strongOuterSwirl = ...;
float unifiedPhotonRing = ...;
float unifiedWrapRing = ...;
```

- [ ] **Step 3: Compose from unified field only**

In `sampleRayLensedAccretion`, use:

```glsl
UnifiedDiscField unified = sampleUnifiedDiscField(uv);
vec3 color = unified.discColor;
float emission = clamp(unified.directDisc + unified.strongOuterSwirl + unified.unifiedPhotonRing + unified.unifiedWrapRing, 0.0, 1.0);
return AccretionField(color, emission, unified.eventShadow, unified.unifiedPhotonRing, unified.directDisc);
```

## Task 3: Cache Bump

**Files:**
- Modify: `public/black-hole-fluid/index.html`
- Modify: `src/components/orbital/orbital-hero.tsx`

- [ ] **Step 1: Bump script and iframe URLs**

Use:

```txt
scroll-dive-cinematic-30
```

## Task 4: Verification

- [ ] **Step 1: Run targeted shader tests**

```powershell
npx vitest run src/lib/black-hole-fluid-shader.test.ts
```

Expected: PASS.

- [ ] **Step 2: Capture Chrome screenshots**

Use Playwright/Chrome to capture:

```txt
.verification/ray-camera-v30-00-top-view.png
.verification/ray-camera-v30-01-mid-tilt.png
.verification/ray-camera-v30-02-side-view.png
.verification/ray-camera-v30-03-drag-side.png
.verification/ray-camera-v30-04-dive-no-white-disc.png
```

- [ ] **Step 3: Run full verification**

```powershell
npm test
npm run lint
npm run build
npm run test:fluid
git diff --check
```

Expected: all pass; Git line-ending warnings are acceptable if there are no whitespace errors.

