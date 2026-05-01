# Black Hole Hero Status - 2026-05-01

## Current saved checkpoint

- Remote baseline before this black-hole work: `origin/main` at `6740344`
- Last committed local baseline before shader tuning: `161e050`
- Current shader asset version: `scroll-dive-cinematic-17`
- Detailed session handoff: `docs/2026-05-01-black-hole-v17-handoff.md`

Checkpoint 9 on GitHub is still the recovered baseline and should not be rewritten. The ray-lensed black-hole work is local branch work on `shader-unified-blackhole-2026-04-30` and should become a new checkpoint only after Liam approves the look.

## Active files

- `src/components/orbital/orbital-hero.tsx` embeds the black-hole runtime and converts wheel/touch input into dive progress.
- `public/black-hole-fluid/index.html` hosts the standalone/embedded WebGL scene.
- `public/black-hole-fluid/fluid.js` contains the shader, scroll-dive camera motion, cursor streamlets, accretion disc, lensing, and side-view transition.
- `src/components/projects/project-journey.tsx` is the post-dive section that appears after the hero releases scroll.
- `src/lib/black-hole-fluid-shader.test.ts` locks down the shader/runtime source contract with string-level tests.

## What changed this session

- Replaced the older layered/foreground-lensing shader path with a pseudo-3D ray-lensed accretion model built around `traceAccretionDisk` and `sampleRayLensedAccretion`.
- Shrunk the visible black shadow using local `shadowRadius`, `photonRingRadius`, `arcRadius`, `diskInnerRadius`, and `diskOuterRadius` terms.
- Tuned the side-view toward the Interstellar reference: smaller central shadow, long horizontal disc, stronger upper/lower lensed arcs, and a tighter bright flow around the inner photon ring.
- Added `innerBridgeGlow` so the outer disc visually connects to the inner ring instead of reading as a loose halo.
- Brightened the side-view flow while keeping the orange palette and homepage text readability.
- Kept the scroll/cursor messaging contract unchanged: parent sends `black-hole-dive`, iframe sends `black-hole-dive-input`.
- Bumped cache/runtime version through `scroll-dive-cinematic-17`.

## Verification completed

- `npm test`: 7 tests passed
- `npm run lint`: passed
- `npm run build`: passed
- `npm run test:fluid`: 2 Playwright tests passed
- `git diff --check`: passed with only line-ending warnings
- Fresh visual captures saved in `.verification/`, including:
  - `ray-lensed-progress-0.png`
  - `ray-lensed-progress-0-32.png`
  - `ray-lensed-progress-0-5.png`
  - `ray-lensed-progress-0-62.png`
  - `homepage-blackhole-current.png`

## Current visual read

The size issue is improved. The v17 pass makes the outer disc brighter and closer to the inner photon ring, with a stronger right-side highlight and readable homepage overlay. No extra 15 percent brightness bump was applied after visual inspection because the current pass already looked substantially denser without washing out the hero copy.

## Next review task

Have Liam review `http://127.0.0.1:5176` and the `.verification/` frames against the reference. If it still feels too dim, increase only the arc/foreground multipliers by about 15 percent; do not enlarge `shadowRadius`.

## Safety notes

- A local-only safety branch named `cleanup-base-checkpoint9-2026-04-30` points at the recovered checkpoint 9 commit.
- If the shader experiment goes wrong, return to commit `161e050` or the safety branch before trying another approach.
