# Canonical Black-Hole Disc Design

## Goal

Make the black-hole hero read as one Interstellar-inspired object from every camera angle. The viewer may describe screenshots as "top" or "side" views, but the shader must not render them as separate visual modes.

## Problem

The current shader still has a partly unified coordinate field plus view-specific visual boosts. `sideView` changes ring radius, ring width, disc brightness, wrap intensity, and adds `horizontalDiscBand`. This makes the edge-on view look like a different black hole instead of the same accretion disc viewed from another angle.

## Design

The side-view Interstellar look becomes the canonical model. The top-view appearance is produced by looking down onto that same model, not by switching to a separate circular recipe.

The canonical model keeps:

- one event shadow radius
- one photon ring radius and width
- one accretion disc inner/outer radius
- one broad amber outer swirl
- one lensed wrap glow derived from the same disc field

Camera angle may affect only geometric projection and visibility:

- ray-disc intersection
- projected/foreshortened disc coordinates
- near-side visibility and Doppler direction
- star parallax and drag orbit

Camera angle must not multiply the brightness of the ring, create a side-only disc band, or change the ring into a different visual object.

## Non-Goals

- Do not rewrite the cursor streamlet system.
- Do not replace the WebGL shader with Three.js in this pass.
- Do not remove the scroll/dive choreography.
- Do not chase a physically exact black-hole simulation; this remains a performant Interstellar-style shader for a portfolio hero.

## Acceptance Criteria

- The shader includes a clear canonical-disc comment/rule.
- `sampleUnifiedDiscField` has no `horizontalDiscBand`, `sideViewBeam`, or side-weighted ring/radius brightness recipes.
- The photon ring and lensed wrap use fixed canonical radii derived from the same shadow radius.
- The top and side camera angles show the same rim identity, with differences coming from projection/visibility only.
- Existing cursor streamlet, drag orbit, build, lint, unit tests, and Playwright tests still pass.
