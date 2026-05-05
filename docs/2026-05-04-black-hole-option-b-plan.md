# Black-Hole Option B: Slab-Intersection Refactor + Star Lensing

**Date:** 2026-05-04
**Status:** Ready to execute. Phase 0 (Q&A) MUST happen before any code change.
**Owner branch:** `shader-unified-blackhole-2026-04-30`
**Current cache key:** `scroll-dive-cinematic-54`. First commit of this work bumps to `-55`.

---

## What this document is

A complete, step-by-step plan for the next AI session to:
1. Ask the user clarifying questions to narrow down the visual target
2. Refactor the black-hole shader so the disc has real 3D thickness (fixes edge-on disappearing)
3. Collapse the four parallel disc-rendering paths into one
4. Add background star lensing (currently absent)
5. Tone the color palette down toward Interstellar/Gargantua pale-gold
6. Verify across the full pitch range with a Playwright sweep

**Critical context:** the user has been iterating on this shader for weeks. Several previous "fixes" treated symptoms instead of root causes. Do not repeat that. Read [Phase 2 root-cause section](#phase-2--core-refactor-3-4-hrs) before writing any GLSL.

**The user explicitly chose Option B over porting [tsBXW3](https://www.shadertoy.com/view/tsBXW3) wholesale**, but liked specific things about that shader (star lensing, disc texture, "physically correct" feel). Those traits are addressed in this plan. If after Phase 2 the user wants to switch, the reference shader notes are at the bottom.

---

## Phase 0 — Q&A FIRST (do not skip)

Before touching code, ask the user these questions in a single message. Wait for answers. Use the answers to set concrete tuning targets.

### Visual target — disc

1. **Disc thickness at edge-on.** On a scale: knife-edge (current), moderate band, fat-puffy like Interstellar's Gargantua. Where do you want to land?
2. **Color saturation.** Current: warm orange/amber (`vec3(0.85, 0.32, 0.05)` outer → `vec3(2.08, 1.36, 0.50)` core). You said "turn down the colour" — do you want pale gold/cream (Gargantua-like), still warm but less saturated, or near-white?
3. **Inner-radius dark gap** (between event horizon and disc inner edge): is this dark gap a feature you want preserved? Yes / make it brighter / make the disc start right at the photon ring.
4. **Front-of-BH disc band** at edge-on: clear thick band crossing in front (Interstellar) or just a subtle hint?

### Visual target — lensing & background

5. **Star lensing strength.** Subtle (just a slight bend near silhouette), Interstellar-level (clear Einstein ring of warped stars), or extreme (whole image distorted near BH)?
6. **Back-half wrap-over halo** (current `unifiedWrapRing`): keep current strength, brighter, or dimmer?

### What you specifically like about tsBXW3

7. The thing you liked most: star lensing? disc texture pattern? overall exposure/darkness? color palette? Something else? Be as specific as you can — this tells me which functions to consider porting if Phase 2 alone falls short.

### Constraints to confirm

8. Is the **scroll-dive integration** untouchable? (default assumption: yes)
9. Are **dragOrbit controls** untouchable? (default: yes)
10. Any **performance** concerns to address, or is current FPS fine?

**Do not proceed past Phase 0 until the user has answered.** Record answers verbatim in a comment block at the top of the first commit message of Phase 2.

---

## Phase 1 — Diagnostic infrastructure (~30 min)

Build the visual safety net before any disc-rendering changes.

### Step 1.1 — Create `e2e/disc-angle-sweep.pw.mjs`

Playwright test that:
- Navigates to `/` (homepage)
- Waits for the iframe canvas to be visible
- For each `progress` in `[0.00, 0.05, 0.10, 0.15, 0.20, 0.25, 0.30, 0.35, 0.40, 0.45, 0.50]`:
  - Posts `{ type: "black-hole-dive", progress }` to the iframe via `page.evaluate`
  - Waits 800 ms for camera to settle
  - Screenshots the BH region (clip to the canvas area, ~`{x:400, y:100, width:800, height:800}` at the configured 1600×1000 viewport)
  - Saves to `.verification/disc-angle-{NN}.png` where `NN = floor(progress*100)`

Reference: existing [e2e/homepage-black-hole.pw.mjs](e2e/homepage-black-hole.pw.mjs) for the iframe locator pattern.

### Step 1.2 — Run it

```
npm run test:fluid -- disc-angle-sweep
```

(Or extend `playwright.config.mjs` `testMatch` if needed.)

### Step 1.3 — Capture baseline

These 11 PNGs are the "before" state. **Do not delete them** — they go in `.verification/baseline-pre-option-b/` so we can diff after Phase 2.

---

## Phase 2 — Core refactor (3–4 hrs)

### Root cause (read before writing GLSL)

`intersectAccretionDisc` ([public/black-hole-fluid/fluid.js](public/black-hole-fluid/fluid.js#L762)) treats the disc as an **infinitely thin 2D plane**. Three downstream problems:

1. **Knife-edge at near-edge-on.** A 2D plane has zero vertical extent, so only the razor-thin band of rays exactly grazing it can produce hits. Disc body collapses to a slice.
2. **Asymmetric edge-on.** `signedCameraHeight = cameraSide * max(abs(camera.origin.y), 0.075)` artificially lifts the camera to ±0.075 to dodge the degenerate ray-in-plane case. This causes only one hemisphere of pixels to find positive-`t` plane hits; the other hemisphere has `visible=0`.
3. **Forced parallel rendering paths.** Because the ray-traced disc cannot render inside the silhouette (it's gated by `outsideShadow`), the codebase grew a screen-space `frontDisc*` lane to fake the front-half-of-BH crossing. That lane runs on different math, different color formula, different inner-radius logic — hence "doesn't look connected" and "has light at the inner radius."

**Fix:** make the disc a slab in 3D, derive visibility from ray-slab intersection, drop the `outsideShadow` gate from disc emission, delete the parallel `frontDisc*` and `projectedDiscCue*` paths.

### Step 2.1 — Rewrite `intersectAccretionDisc`

Replace the current body ([fluid.js:762-785](public/black-hole-fluid/fluid.js#L762)) with this approach:

```glsl
RayDiskHit intersectAccretionDisc(OrbitCamera camera, vec3 rayDir) {
  vec3 rayOrigin = camera.origin;
  float signedCameraHeight = camera.origin.y;  // keep variable name for any test pin

  // Disc has 3D thickness — slab from y = -h to y = +h
  float discHalfThickness = 0.18;  // tunable; see Phase 2.4 for guidance

  // Plane intersection (ideal for non-grazing rays)
  float denomSign = mix(-1.0, 1.0, step(0.0, rayDir.y));
  float safeDenom = denomSign * max(abs(rayDir.y), 0.01);
  float tPlane = -rayOrigin.y / safeDenom;

  // BH closest-approach (ideal for grazing rays nearly parallel to disc plane)
  float tBH = -dot(rayOrigin, rayDir);

  // Blend: prefer plane intersection unless ray is grazing
  float grazing = 1.0 - smoothstep(0.04, 0.25, abs(rayDir.y));
  float t = mix(max(tPlane, 0.0), max(tBH, 0.0), grazing);
  t = clamp(t, 0.0, 8.0);  // keep this exact line — test pin

  vec3 hitPosition = rayOrigin + rayDir * t;

  // Soft visibility from slab membership: 1 at the disc plane, falling off as we move away in y
  float distFromPlane = abs(hitPosition.y);
  float planeProximity = exp(-pow(distFromPlane / discHalfThickness, 2.0));

  // Visible if the ray actually approached the disc plane (not just clamped at t=0)
  float forwardHit = step(0.0, max(tPlane, tBH));
  float visible = forwardHit * planeProximity;

  vec2 discCoord = hitPosition.xz * 0.36;  // keep this exact line — test pin
  discCoord = clamp(discCoord, vec2(-2.2), vec2(2.2));
  vec2 cameraDiscDir = normalize(camera.origin.xz + vec2(0.0001, 0.0));
  float nearDepth = dot(hitPosition.xz * 0.36, cameraDiscDir);
  float nearSide = smoothstep(-0.08, 0.18, nearDepth);  // keep — test pin

  return RayDiskHit(
    discCoord,
    length(discCoord),
    atan(discCoord.y, discCoord.x),
    nearDepth,
    visible,
    nearSide
  );
}
```

**What changes:**
- `signedCameraHeight` is now just `camera.origin.y` (no artificial lift). Variable name preserved for test compatibility.
- `visible` is now soft (0..1) based on slab proximity, not a hard 0-or-1 step.
- For grazing rays, the hit point falls back to BH closest-approach (the chord through the disc).

**Test pins to keep working** (verify these strings still appear in fluid.js after the rewrite):
- `float signedCameraHeight`
- `float safeDenom`
- `vec2 discCoord = hitPosition.xz * 0.36;`
- `float nearSide = smoothstep(-0.08, 0.18, nearDepth);`
- `t = clamp(t, 0.0, 8.0);`

### Step 2.2 — Strip `outsideShadow` from disc emission

In `sampleUnifiedDiscField`, three sites currently have `* outsideShadow` that need to go ([fluid.js around 907, 921, 944](public/black-hole-fluid/fluid.js#L907)):

```glsl
// Before:
float directDiskVisibility = diskHit.visible * outsideShadow * projectedVisibilityTaper * (1.0 - shadowOcclusion * 0.35);
float diskEmission = canonicalDiscGate * compactDiscBody * discFilaments * outsideShadow * (1.0 - shadowOcclusion * 0.2) * (...) * (...);
float denseInnerDisc = denseDiscAnnulus * max(denseDiscCore, 0.42) * discFilaments * denseDiscVisibility * outsideShadow * (1.0 - shadowOcclusion * 0.16) * (...);

// After:
float directDiskVisibility = diskHit.visible * projectedVisibilityTaper * (1.0 - shadowOcclusion * 0.35);
float diskEmission = canonicalDiscGate * compactDiscBody * discFilaments * (1.0 - shadowOcclusion * 0.2) * (...) * (...);
float denseInnerDisc = denseDiscAnnulus * max(denseDiscCore, 0.42) * discFilaments * denseDiscVisibility * (1.0 - shadowOcclusion * 0.16) * (...);
```

The disc now renders wherever `diskHit.visible > 0` (slab membership) AND `canonicalDiscGate > 0` (in disc radii) AND `nearSide > 0` (front half). The `outsideShadow` gate is no longer needed because the slab geometry naturally suppresses disc rendering inside the silhouette except where the disc actually crosses in front.

`outsideShadow` STAYS in the photon ring, wrap halo, lensed envelope, and inner bridge glow — those are not the disc body and need to remain gated to outside the silhouette.

### Step 2.3 — Delete the parallel `frontDisc*` and `projectedDiscCue*` paths

Delete from `sampleUnifiedDiscField`:
- All `frontDisc*` variables: `frontDiscNearSide`, `frontDiscProjection`, `frontDiscLaneTexture`, `frontProjectedInnerTaper`, `frontDiscLaneOffset`, `frontDiscLaneY`, `frontDiscPlane`, `frontDiscSpan`, `frontDiscCenterSoftness`, `frontDiscShadowWindow`, `frontDiscOccludingLane`, `frontDisc`, `frontDiscColorRamp`, `frontDiscColor`
- The `vec2 frontBandP = projectedFrontDiscOcclusionBand(uv);` line
- The `projectedFrontDiscOcclusionBand` function definition (find with grep)
- All `projectedDiscCue*` variables (`projectedDiscPlane`, `projectedDiscGate`, `projectedDiscCue`, `projectedTailTaper`, `projectedInnerTaper`, `projectedVisibilityTaper`, `projectedAccretionBand` function call site, `projectedAccretionBand` function definition, `denseDiscProjectedCue`)

Update `canonicalDiscVisibility` and `spiralVisibility` and `denseDiscVisibility` to drop the `projectedDiscCue` fallback term. They become simply:

```glsl
float spiralVisibility = directDiskVisibility * nearSideVisibility;
float canonicalDiscVisibility = directDiskVisibility * nearSideVisibility;
float denseDiscVisibility = directDiskVisibility * nearSideVisibility;
```

(No more `max(..., projectedDiscCue * 0.16)` etc.)

Update the `UnifiedDiscField` struct to remove `frontDiscColor` and `frontDisc` fields. Update `sampleRayLensedAccretion` to drop `unified.frontDisc * 0.34 +` from the emission sum and remove `unified.frontDiscColor` from the `AccretionField` constructor.

Update `main()` to remove the `color += accretion.frontDiscColor * mix(1.0, 0.78, collapse);` line. The compositing becomes:
```glsl
color += accretion.backDiscColor * mix(1.0, 0.78, collapse);  // disc renders everywhere now
color = mix(color, vec3(0.00012, 0.00004, 0.000015), accretion.eventShadow);
color += accretion.ringGlowColor * mix(1.0, 0.78, collapse);
```

Note: with the new slab model, `backDiscColor` includes both the front-half (overdraws shadow because it composites BEFORE the shadow mix) and the back-half. Wait — that's wrong. **The compositing order needs reconsideration.** With the slab fix, the disc material itself can render inside the silhouette, but it should only appear there for FRONT-half hits (`nearSide > 0`). The back-half hits at the same screen positions are occluded by the BH.

The cleanest compositing:
1. Add disc color (shows everywhere ray-disc intersection has front-half hits)
2. Apply event shadow as a darken on TOP of the disc, but only where the ray didn't hit the disc on front-half (i.e., where the BH would be visible, not the disc)

Implement this by passing two separate emission values out of `sampleUnifiedDiscField`:
- `discColorOpaque` — the disc rendering, full intensity
- `eventShadowMasked` — eventShadow * (1 - frontHalfHitStrength), so shadow only darkens where disc isn't covering it

Then in `main()`:
```glsl
color = mix(color, vec3(0.00012, ...), accretion.eventShadowMasked);  // BH darkens, but not where disc covers
color += accretion.discColor * mix(1.0, 0.78, collapse);
color += accretion.ringGlowColor * mix(1.0, 0.78, collapse);
```

Where `eventShadowMasked = eventShadow * (1.0 - clamp(diskHit.visible * diskHit.nearSide * canonicalDiscGate, 0.0, 1.0))`.

### Step 2.4 — Tune `discHalfThickness`

Start at `0.18`. After implementing 2.1–2.3, run the angle-sweep diagnostic. Look at `disc-angle-25.png` (mid-tilt) and `disc-angle-50.png` (edge-on):
- If disc looks too thin → bump to `0.24`
- If disc looks fat/puffy/wrong → drop to `0.12`
- Iterate twice max; if it still looks off, the issue is elsewhere, don't keep tweaking this constant.

### Step 2.5 — Test churn

Tests that will fail and need updating:
- Any test pinning `outsideShadow` in `directDiskVisibility`, `diskEmission`, `denseInnerDisc` formulas (line ~401, 458, 481, 564)
- Tests pinning `frontDisc*` variables (entire test block "lets only near-side front disc material cross in front of the shadow")
- Tests pinning `projectedDiscCue*` (entire "tapers projected disc cues" block)
- Tests pinning the `UnifiedDiscField` struct field list and `AccretionField` struct
- Tests pinning the `main()` compositing order

**Approach for test updates:** **relax pins from formula-level to behavior-level.** Instead of asserting an exact GLSL string, assert the variable name exists and the slab thickness is set. Example:

```js
// Old (formula pin):
expect(unifiedFieldBlock).toContain("float directDiskVisibility = diskHit.visible * outsideShadow * projectedVisibilityTaper * (1.0 - shadowOcclusion * 0.35);");

// New (behavior pin):
expect(unifiedFieldBlock).toContain("float directDiskVisibility");
expect(unifiedFieldBlock).toMatch(/diskHit\.visible.*projectedVisibilityTaper|diskHit\.visible.*shadowOcclusion/);
```

Mark removed tests as `it.skip(...)` rather than deleting, so the user can see what changed.

### Step 2.6 — Verify Phase 2

- Re-run angle-sweep diagnostic. Save outputs to `.verification/post-option-b/`. Diff against baseline by eye (or a perceptual diff if available).
- `npm test` — should pass (with relaxed assertions)
- `npm run lint`, `npm run build` — should pass
- Bump cache key 54 → 55

**Do not proceed to Phase 3 unless the user looks at the diagnostic and approves Phase 2.** Show them both the baseline and post-option-b angle sweeps side by side.

---

## Phase 3 — Background star lensing (~1–2 hrs)

After the user approves Phase 2.

### Step 3.1 — Bend the star UV

Currently in `main()` at [fluid.js:1061-1062](public/black-hole-fluid/fluid.js):
```glsl
vec2 starUv = dragOrbitStarUv(worldUv);
color += baseStarField(starUv) * starFieldVisibility();
```

The star UV is sampled directly without any lensing.

Add gravitational lensing of the background:
```glsl
// Compute the bent ray direction (the disc rendering already does this via bendRayTowardBlackHole)
OrbitCamera starCamera = buildOrbitCamera(worldUv);
vec3 starBentRay = bendRayTowardBlackHole(starCamera, aspectPoint(worldUv));

// Convert bent ray back to UV space — use the bent direction's projected screen position
// instead of the raw worldUv. Roughly: take the difference between bent and unbent,
// project that difference onto the screen plane, and offset starUv by it.
vec2 lensOffset = (starBentRay.xy - starCamera.rayDir.xy) * 0.6;  // 0.6 is tunable lens strength
vec2 starUv = dragOrbitStarUv(worldUv + lensOffset);
color += baseStarField(starUv) * starFieldVisibility();
```

Also gate this so the star field is dim/dark inside the BH silhouette (rays going INTO the BH don't show stars):
```glsl
float starShadowGate = 1.0 - smoothstep(shadowRadius * 0.92, shadowRadius * 1.08, length(aspectPoint(worldUv)));
color += baseStarField(starUv) * starFieldVisibility() * starShadowGate;
```

### Step 3.2 — Test churn

The test "draws a lightweight star background without compiling legacy lensing passes" asserts `not.toContain("vec3 sampleLensedBackground")`. Our approach doesn't introduce that legacy function name, so that pin still passes. Verify.

If we name the lens-offset variable something the test pins exclude, no test update needed.

### Step 3.3 — Tune `lensOffset` strength

Starting value `0.6`. User answer to Phase 0 question 5 determines target:
- "subtle" → 0.3
- "Interstellar-level" → 0.6 to 0.9
- "extreme" → 1.2

Iterate based on the angle-sweep visual.

---

## Phase 4 — Color tuning (~30 min)

User said "turn down the colour." After Phase 0 question 2, you have a target.

Targets to try based on user preference (`accretionColorRamp` in [fluid.js:810-820](public/black-hole-fluid/fluid.js#L810)):

**Pale gold / Gargantua:**
```glsl
vec3 ember = vec3(0.32, 0.18, 0.08);
vec3 orange = vec3(0.78, 0.52, 0.22);
vec3 gold = vec3(1.20, 0.92, 0.48);
vec3 white = vec3(1.85, 1.55, 1.10);
```

**Less saturated warm:**
```glsl
vec3 ember = vec3(0.18, 0.10, 0.05);
vec3 orange = vec3(0.70, 0.40, 0.18);
vec3 gold = vec3(1.20, 0.78, 0.32);
vec3 white = vec3(2.00, 1.50, 0.85);
```

**Near-white core:**
```glsl
vec3 ember = vec3(0.13, 0.025, 0.007);
vec3 orange = vec3(0.84, 0.25, 0.034);
vec3 gold = vec3(1.24, 0.62, 0.13);
vec3 white = vec3(2.40, 2.00, 1.40);  // brighter, less yellow
```

Update the relevant test pin (test currently asserts specific color values — line ~357-358).

---

## Phase 5 — Verify, commit, move on (~30 min)

1. Re-run angle-sweep diagnostic, save to `.verification/final/`.
2. `npm test` — all green.
3. `npm run lint`, `npm run build` — all green.
4. `npm run test:fluid` — all green (this is the existing fluid Playwright suite).
5. Bump cache key one more time if Phase 3 or 4 made shader changes.
6. Update `docs/2026-05-01-black-hole-v17-handoff.md` (or create a new dated handoff doc) with what changed and why.
7. **Do not commit unless the user explicitly asks.** Per CLAUDE.md.

---

## Constraints (read once, comply throughout)

From [CLAUDE.md](CLAUDE.md):
- TypeScript strict mode
- Functional components, named exports, early returns
- Never commit `.env.local`
- Ask before force-push or destructive git operations
- **Do not rewrite GitHub checkpoint 9; make new work as local changes/branches/checkpoints.**

Working features that MUST keep working — do not break:
- Scroll-dive: `postMessage` protocol between `orbital-hero.tsx` and the iframe (`black-hole-dive` / `black-hole-dive-input`)
- dragOrbit pointer drag (yaw/pitch)
- Cursor streamlets (`updateStreamlets`, `pushStreamPoint`, `wavefrontSource`)
- Dye/bloom buffer (`sampleBloom`, `advectShader`)
- Dive glow (`sampleDiveGlow`, surge/violence/tremor uniforms)
- Tone mapping `color = vec3(1.0) - exp(-color * mix(1.26, 1.72, surge));`
- Vignette + dive collapse fade

Test pins that should remain (do not break these):
- `expect(shaderSource).toContain("float starGrid");`
- `expect(shaderSource).toContain("vec3 baseStarField");`
- `expect(shaderSource).toContain("uniform vec4 uDragOrbit;");`
- `expect(shaderSource).toContain("vec2 dragOrbitStarUv");`
- `expect(shaderSource).toContain("vec2 viewToWorldUv");`
- All `dragOrbit.*` JS pins (pointermove handler, target updates, etc.)
- `expect(shaderSource).toContain("vec3 sampleDiveGlow");`
- `expect(shaderSource).toContain('event.data.type !== "black-hole-dive"');`
- `expect(shaderSource).toContain("pushStreamPoint");`
- `expect(shaderSource).toContain("updateStreamlets(dt, now / 1000)");`

---

## Reference shaders (saved for possible future use)

The user looked at these before choosing Option B. **Do not port these wholesale.** They are listed here so a future session can cherry-pick specific functions if Phase 2 outcomes are not enough.

### tsBXW3 — "Black hole with accretion disk"
- URL: https://www.shadertoy.com/view/tsBXW3
- Approach: ray-marched, uses **inverse-square force** to bend ray-marched light rays (approximated lensing, like ours)
- Author admits "lots of room for improvement" on colors and disk
- **What the user liked:** "star lensing effect looks better, the disc looks nice and it looks physically correct"
- **Cherry-pickable functions** (if needed): the lensing offset formula, the disc texture function, the temperature-to-color ramp
- **What our shader has that tsBXW3 doesn't:** dive integration, dragOrbit, cursor streamlets, dye buffer, scroll progression, message contract — porting tsBXW3 would lose all of this

### XlfGRj — "Star Nest" by Pablo Román Andrioli (Kali)
- URL: https://www.shadertoy.com/view/XlfGRj
- Approach: 3D Kaliset fractal iteration → volumetric-feeling nebula + bright stars
- ~50 lines, pure procedural (no textures), very fast
- **What the user liked:** "i also like this shader for stars"
- **If desired in a future session:** drop-in replacement for `baseStarField` in [fluid.js](public/black-hole-fluid/fluid.js). Sample with `dragOrbitStarUv(worldUv)` UV. Tune the iteration count (5–8) for performance vs nebula richness.
- **Note:** Star Nest output is colorful (cyan/magenta nebula clouds). May want to desaturate or tint to match the warm BH palette.

---

## Definition of done

- [ ] User has answered Phase 0 questions
- [ ] Diagnostic Playwright sweep saved to `.verification/baseline-pre-option-b/`
- [ ] `intersectAccretionDisc` rewritten with slab intersection, `discHalfThickness` tuned
- [ ] `outsideShadow` removed from `directDiskVisibility`, `diskEmission`, `denseInnerDisc`
- [ ] `frontDisc*` and `projectedDiscCue*` variable families and their helper functions deleted
- [ ] Compositing in `main()` updated for new disc/shadow ordering
- [ ] `npm test` passes (with relaxed pins)
- [ ] `npm run lint`, `npm run build` pass
- [ ] User has approved the post-Phase-2 angle sweep before proceeding
- [ ] (Phase 3) Star lensing implemented if user wants it
- [ ] (Phase 4) Colors toned to user's preference
- [ ] Cache key bumped
- [ ] Final diagnostic sweep saved to `.verification/final/`
- [ ] Handoff doc updated with what changed
