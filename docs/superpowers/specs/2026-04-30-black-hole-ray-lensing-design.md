# Black Hole Ray Lensing Design

## Goal

Rebuild the black-hole hero visual so it reads closer to the Interstellar/NASA edge-on reference: a dominant dark shadow, a thin controlled photon ring, an accretion disk that is occluded by the black hole, and lensed far-side arcs above and below the shadow.

## Current Problem

The current shader still behaves like an additive 2D painting. The side-view disk can be seen through the shadow, and a broad orange glow reduces the black-hole silhouette. This makes the scene look like a glowing ring with a foreground stripe instead of an occluding gravitational object.

## Design

Keep the existing iframe, scroll progress, cursor streamlets, WebGL canvas, and project handoff. Replace the display shader's accretion model with a pseudo-3D ray/lensing model:

- Cast a per-pixel camera ray from a simple virtual camera.
- Intersect that ray with an accretion disk plane.
- Use the intersection depth to classify direct near-side disk light versus far-side disk light.
- Apply a shadow gate so direct disk emission cannot draw through the event-horizon shadow.
- Render far-side disk light as lensed upper and lower arcs around the shadow.
- Render the photon ring as a thin, restrained edge around the shadow.
- Reduce the broad atmospheric glow and tone mapping intensity.

The implementation remains shader-only for this pass. A Three.js scene is deferred because a mesh torus alone would not solve gravitational lensing or shadow occlusion; it would still need custom shader math and more runtime plumbing.

## Acceptance

- At edge-on progress, the disk must not visibly cut through the black-hole center.
- The center must remain clean, dark, and visually dominant.
- Glow must be localized rather than a large orange fog around the object.
- The side-view read should come from a near-side band plus lensed top/bottom arcs.
- Cursor streamlets should still work and decay similarly.
- The existing `{ type: "black-hole-dive", progress }` contract must remain unchanged.
- The asset version should bump to `scroll-dive-cinematic-15`.
