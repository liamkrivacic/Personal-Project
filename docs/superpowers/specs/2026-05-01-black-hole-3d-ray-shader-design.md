# Black Hole 3D Ray Shader Design

## Goal

Rebuild the black-hole display shader around a real orbit-camera ray model so the accretion disc rotates continuously under cursor drag, while preserving the existing cursor light streamlets, scroll dive handoff, and Vercel-friendly static deployment.

## Context

The current visual is a procedural WebGL fragment shader. It is GPU-rendered, but it is not a mesh-based 3D scene. The accretion disc is created by flattening and shifting screen coordinates, then layering direct disc light, a side band, photon ring, shadow, and lensed arcs.

That approach produces an Interstellar-like silhouette, but it still contains mirrored projection cues. When vertical drag reaches edge-on, some cues can read as a reflection instead of a continuous orbit.

## References

Interstellar's Gargantua was rendered with DNGR, a custom gravitational renderer built around light propagation near a Kerr black hole. The practical reference point is the published DNGR paper: https://arxiv.org/abs/1502.03808.

A full DNGR implementation is out of scope for a browser portfolio hero. This design keeps the practical shader approach, but adopts the important architectural idea: camera rays should drive the image, not mirrored screen-coordinate hacks.

## User-Facing Requirements

- Cursor drag must still rotate the black hole.
- Vertical drag must continue through edge-on without a visual bounce or reflection.
- Cursor light streamlets must still appear, orbit, and decay similarly to the current implementation.
- Scroll-dive behavior and the iframe message contract must stay intact.
- The visual target remains Interstellar/Gargantua-inspired: dark center, thin photon ring, horizontal disc, upper/lower lensed arcs, controlled orange/gold glow.
- Performance must remain suitable for free Vercel hosting and normal laptops by keeping the existing display and simulation resolution caps.

## Architecture

The display shader will use a real 3D orbit camera:

1. Mouse drag and scroll determine yaw and inclination.
2. The shader builds a camera position on an orbital sphere around the black hole.
3. Each pixel creates a 3D ray from that camera through the image plane.
4. The ray is lightly bent toward the black hole for a cinematic gravitational-lensing approximation.
5. The bent ray intersects the accretion disc plane.
6. The disc hit drives direct disc emission, Doppler-like brightness, and near/far side classification.
7. Separate lensing terms draw the photon ring and far-side upper/lower arcs around the shadow.
8. The existing fluid dye streamlets are composited on top as they are today.

This is not a full relativistic ray tracer. It is a physically inspired shader architecture that fixes rotation continuity at the root while keeping the hero performant.

## Implementation Boundaries

Modify:
- `public/black-hole-fluid/fluid.js`
- `public/black-hole-fluid/index.html`
- `src/components/orbital/orbital-hero.tsx`
- `src/lib/black-hole-fluid-shader.test.ts`

Do not materially rewrite:
- streamlet data structures
- streamlet input thresholds
- advect shader behavior
- parent/iframe scroll message contract
- project journey components

## Testing

Use string-level Vitest coverage for shader architecture because the shader is embedded in `fluid.js` as a string. Verify:

- display shader contains `OrbitCamera`
- camera rays are built from `origin`, `forward`, `right`, `up`, and `rayDir`
- accretion hits come from a real `intersectAccretionDisc` function
- the old signed screen-projection helpers are gone
- cursor streamlet functions and uniforms remain present
- cache versions update together

Use Playwright for runtime WebGL compilation and visual screenshot checks:

- idle black hole
- cursor streamlets orbiting/decaying
- drag-up through edge-on
- drag-down through edge-on
- homepage iframe integration

## Acceptance Criteria

- `npm test`, `npm run lint`, `npm run build`, and `npm run test:fluid` pass.
- Browser screenshots show a stable black-hole render with no blank canvas.
- Drag screenshots show continuous orbit through edge-on with no obvious x-axis reflection.
- Cursor streamlets still render and decay.
- The implementation does not introduce server-side dependencies or paid-hosting requirements.
