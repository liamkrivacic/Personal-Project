# Black Hole Ray Lensing Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace the over-glowy additive accretion render with a pseudo-3D ray/lensing shader that keeps the black-hole shadow dark and occludes disk light correctly.

**Architecture:** Keep the current standalone WebGL runtime and iframe message contract. Rebuild only the display shader's accretion model, leaving cursor streamlet simulation and scroll handoff intact.

**Tech Stack:** JavaScript module, WebGL2 GLSL ES 3.00, Vitest shader source tests, Playwright visual capture.

---

### Task 1: Encode the New Shader Contract in Tests

**Files:**
- Modify: `src/lib/black-hole-fluid-shader.test.ts`

- [x] **Step 1: Write failing tests**

Add expectations for `struct RayDiskHit`, `RayDiskHit traceAccretionDisk`, `float shadowOcclusion`, `float directDiskVisibility`, `float upperLensedArc`, `float lowerLensedArc`, `float restrainedPhotonRing`, and `scroll-dive-cinematic-15`.

- [x] **Step 2: Run the focused test**

Run: `npm test -- src/lib/black-hole-fluid-shader.test.ts`

Expected: fail because the current shader uses `sampleUnifiedAccretionField` and version `scroll-dive-cinematic-14`.

### Task 2: Rebuild the Accretion Shader

**Files:**
- Modify: `public/black-hole-fluid/fluid.js`

- [x] **Step 1: Replace the additive accretion model**

Replace `AccretionField sampleUnifiedAccretionField(vec2 uv)` with ray/disk helpers and `AccretionField sampleRayLensedAccretion(vec2 uv)`.

- [x] **Step 2: Enforce shadow occlusion**

Ensure direct disk emission is multiplied by `directDiskVisibility` and cannot contribute inside `shadowOcclusion`.

- [x] **Step 3: Add restrained lensed arcs**

Add upper and lower lensed arcs around the shadow, with small photon-ring energy and Doppler asymmetry.

- [x] **Step 4: Reduce broad orange atmosphere**

Lower display shader atmospheric and dive glow contribution so the black silhouette stays dominant.

### Task 3: Preserve Runtime Contract and Version

**Files:**
- Modify: `src/components/orbital/orbital-hero.tsx`
- Modify: `public/black-hole-fluid/index.html`

- [x] **Step 1: Bump asset version**

Change both references from `scroll-dive-cinematic-14` to `scroll-dive-cinematic-15`.

- [x] **Step 2: Keep message names unchanged**

Confirm `black-hole-dive` and `black-hole-dive-input` remain unchanged.

### Task 4: Verify and Visually Inspect

**Files:**
- Screenshot output: `.verification/`

- [x] **Step 1: Run focused shader tests**

Run: `npm test -- src/lib/black-hole-fluid-shader.test.ts`

- [x] **Step 2: Capture progress frames**

Capture `0`, `0.18`, `0.32`, `0.5`, `0.62`, `0.78`, and `0.94` to `.verification/ray-lensed-progress-*.png`.

- [x] **Step 3: Run full verification**

Run: `npm test`, `npm run test:fluid`, `npm run lint`, and `npm run build`.
