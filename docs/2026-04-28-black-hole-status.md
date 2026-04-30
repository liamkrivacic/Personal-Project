# Black Hole Hero Next Task - 2026-04-30

## Current saved checkpoint

- Remote baseline: `origin/main`
- Commit: `6740344`
- Label: `checkpoint 9: post-dive project journey and design archive`
- Live shader asset version: `scroll-dive-cinematic-13`

This checkpoint is the correct recovered iteration. Do not rewrite checkpoint 9 on GitHub. Treat any new work as a local branch or a new checkpoint after the fix is proven.

## Active files

- `src/components/orbital/orbital-hero.tsx` embeds the black-hole runtime and converts wheel/touch input into dive progress.
- `public/black-hole-fluid/index.html` hosts the standalone/embedded WebGL scene.
- `public/black-hole-fluid/fluid.js` contains the shader, scroll-dive camera motion, cursor streamlets, accretion disc, lensing, and side-view transition.
- `src/components/projects/project-journey.tsx` is the post-dive section that appears after the hero releases scroll.

## Next task

Fix the black-hole side orientation so the horizontal inner side-view disc reads as part of the same accretion structure as the outer disc.

The current issue is not just "make the line less visible." The desired effect is:

- the side-view horizontal band should connect to the outer disc instead of feeling like a separate strip
- the band should visually flow into the outer disc through shared glow, radial falloff, and rim energy
- the orbital swing should feel like the camera is moving around one object, not swapping to a different layer
- the final dive should still feel cinematic and pull the viewer into the hole
- any large seam, line, boxed edge, or hard sampling boundary should be removed

## Implementation direction

Prefer a structural shader pass over small parameter tweaks.

Recommended approach:

- Refactor the disc rendering around one shared disc coordinate field, then derive face-on and side-on appearances from that field.
- Add a feathered bridge between the side band and outer disc using radial distance, angular alignment, and dive/orbit progress.
- Share emission color, lensing distortion, grain/noise, and rim glow between the band and the outer disc so their edges blend naturally.
- Avoid hard `step`/rectangular masks in the side-view layer; use smooth falloffs and energy-preserving blends.
- Keep the event contract from `orbital-hero.tsx` intact: the iframe still receives `black-hole-dive` messages with a `progress` value.

## Verification target

Before calling the fix done:

- run `npm test`
- run `npm run test:fluid`
- manually inspect the hero at the start, mid-orbit side view, near-capture, and post-dive handoff
- capture fresh screenshots into `.verification/` if visual comparison is needed
- confirm the project journey still appears after the dive

## Safety notes

- A local-only safety branch named `cleanup-base-checkpoint9-2026-04-30` points at the recovered checkpoint 9 commit.
- If the shader experiment goes wrong, return to commit `6740344` or that local branch before trying another approach.
