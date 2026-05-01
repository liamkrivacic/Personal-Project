# Unified Black Hole Strong Swirl Design

## Goal

Make the black hole read as one continuous object from top view through side view, while restoring the strong chapter 8/9-style orange swirl that reaches far into the page.

## Problem

The current shader uses a real orbit camera for the disc hit, but the final image still mixes several separate visual recipes:

- top view uses circular radial photon-ring terms
- side view adds special projected band terms
- side view also adds a separate outer tail that reads like a beam

Because those layers fade in and out independently, the black hole looks like it transforms into a different object as the camera rotates.

## Desired Behavior

- Top view, tilted view, and side view must use one shared accretion-disc field.
- The accretion disc should be sampled in disc coordinates and projected by the same orbit camera.
- The side view should look like the same top-view disc compressed into perspective, not a new ribbon pasted on top.
- A strong logarithmic orange swirl should return, similar to the older checkpoint 8/9 feeling, and it should live in disc coordinates so it rotates and compresses with the disc.
- The photon ring and lensed wrap should remain visually connected to the same disc field.
- Drag orbit, cursor streamlets, and scroll dive messaging must stay intact.
- The removed white scroll-dive flash must stay removed.

## Shader Architecture

Add a unified accretion surface:

1. Build `OrbitCamera` as before.
2. Intersect the camera ray with the disc plane as before.
3. Convert that hit into a single `UnifiedDiscField`:
   - projected disc coordinates
   - radius and angle
   - near/far visibility
   - direct disc density
   - strong outer logarithmic swirl
   - wrap/lensed ring contribution
   - Doppler-like brightness
4. Compose the final black hole using that one field:
   - direct disc material
   - strong outer swirl envelope
   - photon ring and lensed wrap
   - event shadow
5. Remove side-only projected helper layers:
   - `discPlaneCore`
   - `innerHorizontalRim`
   - `alignedOuterDiscTail`
   - `topViewOuterRing`

## Visual Notes

The strong swirl should be intentionally visible, not subtle. It should extend farther than the current v29 halo and should be readable in both top and side view. It can be dramatic, but it should not become a detached beam; all long streaks must be tied to disc radius/angle.

## Testing

String-level shader tests should assert:

- `struct UnifiedDiscField`
- `UnifiedDiscField sampleUnifiedDiscField`
- `float strongOuterSwirl`
- `float unifiedWrapRing`
- `float unifiedPhotonRing`
- absence of the side-only v29 terms listed above
- cache key bumped to `scroll-dive-cinematic-30`

Runtime checks should capture:

- top view
- mid tilt
- side view
- drag-through side view
- scroll dive without white disc flash

