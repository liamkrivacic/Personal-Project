# Black Hole Hero Status - 2026-04-28

## Current saved checkpoint

- `checkpoint-4-smaller-hole-lower-disc-cinematic-2026-04-27`
- Commit: `81faaaa`
- Meaning: smaller starting black hole, lower accretion-disc emphasis, cinematic baseline

## Current work after checkpoint 4

These changes are currently local and not checkpointed yet:

- `public/black-hole-fluid/fluid.js`
- `public/black-hole-fluid/index.html`
- `design/black-hole-fluid/fluid.js`
- `design/black-hole-fluid/index.html`
- `src/components/orbital/orbital-hero.tsx`

This current live version is using shader asset version:

- `scroll-dive-cinematic-11`

## What we are up to

We moved beyond the straight scroll-zoom and started building a scroll-driven orbital rotation effect.

The goal of the current WIP version is:

- as the user scrolls, the black hole should feel like it is rotating in space
- the accretion disc should swing toward a more side-on view, closer to the reference image
- the disc should keep sweeping upward
- the final stage should still end in a dive into the black hole

The current version has the first pass of that orbital sweep wired into the shader, but it is still not visually strong enough yet.

## Known issue still not fixed

There is still a noticeable artifact in the black hole:

- a big line / seam / box-like edge is still visible in the black-hole image
- this was not present in checkpoint 2, so it appears to have been introduced by later scroll/dive era changes
- we suspect it is tied to the post-checkpoint dive/warp sampling path, but it has not been fully resolved

So the black hole is still not clean yet. The line issue remains an active bug.

## Visual state summary

Right now the project is in this state:

- homepage hero is the main experience
- background is the interactive black-hole shader
- stars and lensing are present
- cursor interaction is active outside the horizon
- scroll drives the dive instead of moving down the page
- checkpoint 4 is the stable baseline
- current local work is the experimental rotating / side-on disc transition

## Best restart points

- Stable baseline: `81faaaa` / `checkpoint-4-smaller-hole-lower-disc-cinematic-2026-04-27`
- Earlier stable baseline: `add4443` / `checkpoint-3-cinematic-scroll-dive-blackhole-2026-04-27`
- Star-lensed baseline before dive-heavy work: `f1ac3c6` / `checkpoint-2-star-lensed-blackhole-hero-2026-04-27`
