# Site Architecture — Two Black-Hole Pages (as of checkpoint 14)

> **Read this first** if you are an AI assistant picking up this project.
> This document describes the current live structure of the portfolio and the shader setup behind it.

---

## Overview

The portfolio runs on **Next.js 16 App Router**. There are currently two live hero pages:

| Route | Shader | Component | Public assets |
|-------|--------|-----------|---------------|
| `/`   | Slab-intersection ray-marcher (Option B refactor) | `src/components/orbital/orbital-hero.tsx` | `public/black-hole-fluid/` |
| `/v2` | tsBXW3 Shadertoy port (new style, checkpoint 14+) | `src/components/orbital/orbital-hero-tsbxw3.tsx` | `public/black-hole-tsbxw3/` |

Both pages append `<ProjectJourney />` below the hero so the scroll-dive lands in the projects section.

---

## The `/v2` Page — tsBXW3 Shader (preferred style)

### What it is
A full WebGL2 / GLSL ES 3.0 local port of the Shadertoy shader **tsBXW3** (full inverse-square gravitational lensing, ray-marched accretion disc, procedural star field). The original Shadertoy URL cannot be embedded directly (X-Frame-Options: SAMEORIGIN), so the shader is hosted locally.

### File locations
```
public/black-hole-tsbxw3/
  index.html      — bare canvas page, loads fluid.js as ES module
  fluid.js        — full WebGL2 shader runtime
src/app/v2/
  page.tsx        — Next.js page, renders OrbitalHeroTsbxw3 + ProjectJourney
src/components/orbital/
  orbital-hero-tsbxw3.tsx  — React wrapper: scroll-dive logic + postMessage bridge
```

### Shader architecture (`fluid.js`)
The shader runs in a `requestAnimationFrame` loop on a full-viewport `<canvas>`. Uniforms updated each frame:

| Uniform | Type | Description |
|---------|------|-------------|
| `uTime` | float | elapsed seconds |
| `uDiveProgress` | float | 0 → 1, driven by parent scroll |
| `uDragYaw` | float | horizontal rotation from pointer drag |
| `uDragPitch` | float | vertical rotation from pointer drag |

**Camera**: `zoomDistance = mix(7.0, 0.6, smoothstep(0.0, 1.0, diveT))` — at progress 0 the camera is far out; at 1 it is nearly at the event horizon.

**Background**: Procedural star field only (no nebula / iChannel0). Two octaves of value noise, `brightness = pow(brightness, 256.0)`, coloured blue→orange based on a second noise channel.

**Black hole + disc**: Full tsBXW3 ray-marching. 20 outer iterations × 6 inner convergence steps. Gravitational lensing via inverse-square deflection. Accretion disc emits orange-to-white thermal gradient.

### postMessage protocol
The iframe and the parent page communicate over `window.location.origin` (same-origin, no wildcard).

**Parent → iframe** (scroll progress):
```js
{ type: "black-hole-dive", progress: 0.0..1.0 }
```
The iframe reads this and sets `uDiveProgress`.

**Iframe → parent** (user scroll/touch inside canvas):
```js
{ type: "black-hole-dive-input", delta: number }
```
`delta` is a normalised scroll delta. The parent accumulates it into `depth` and re-broadcasts progress back.

### Interaction model
- **Scroll / touch-swipe**: zooms camera into the black hole. Reaching `progress ≥ 0.995` releases the page scroll lock and smooth-scrolls to `#projects`.
- **Pointer drag**: rotates the camera only (`dragYaw` / `dragPitch`). Pitch is clamped to ±1.4 rad. Has no effect on dive progress.
- **Scroll-lock**: the parent locks `document.body` overflow on mount and unlocks only after the dive completes (or on unmount).

---

## The `/` Page — Slab BH (Option B refactor)

### What it is
The original custom ray-marcher, refactored in the Option B pass (checkpoint 13–14). Same scroll-dive protocol. Uses a **slab intersection** for the accretion disc so it remains visible edge-on.

### File locations
```
public/black-hole-fluid/
  index.html      — bare canvas page
  fluid.js        — WebGL2 shader runtime (cache key 55)
src/components/orbital/
  orbital-hero.tsx         — React wrapper (identical dive logic)
src/lib/
  black-hole-fluid-shader.test.ts  — Vitest tests pinning key GLSL fragments
```

### Key shader decisions (Option B)
- **Slab intersection** (`discHalfThickness = 0.22`): Gaussian falloff replaces knife-edge plane intersection so the disc is visible at all angles.
- **Disc in front of BH**: `frontDiscColor` composites *after* the shadow mix so it is not occluded by the black-hole silhouette.
- **Pale gold palette**: `ember(0.10,0.05,0.02)` → `orange(0.65,0.42,0.18)` → `gold(1.10,0.90,0.45)` → `white(1.85,1.55,0.95)`.
- **Star lensing**: `bendRayTowardBlackHole` deflects the star-field UV so stars arc near the horizon (Interstellar-style, strength 0.7).

---

## Tests

```
npm test              # Vitest — pins GLSL formula substrings in fluid.js
npm run test:fluid    # Playwright — visual/runtime smoke tests (e2e/)
```

The Vitest tests in `src/lib/black-hole-fluid-shader.test.ts` use `toContain` to lock specific formula strings. If you change the original shader (`public/black-hole-fluid/fluid.js`) you must update the matching test pins.

The `/v2` shader (`public/black-hole-tsbxw3/fluid.js`) has no dedicated test file yet.

---

## Checkpoint naming convention

| Commit prefix | Meaning |
|---------------|---------|
| `checkpoint N:` | Iterative improvement on the original `/` shader |
| `checkpoint 14 (tsbxw3-style):` | The first commit of the new tsBXW3 `/v2` page |
| Future `/v2` work | Continue incrementing from 14 on the same branch |

The current branch is `shader-unified-blackhole-2026-04-30`. When the `/v2` style is promoted to `/`, a new branch and checkpoint sequence begins.

---

## CLAUDE.md quick reference

The canonical runtime files listed in `CLAUDE.md` still point to the original `/` page. Until `/v2` is promoted to `/`, treat `/v2` as the **preferred style under active development** and `/` as the **stable fallback**.
