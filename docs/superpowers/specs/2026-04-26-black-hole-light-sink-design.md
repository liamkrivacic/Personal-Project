# Black Hole Light Sink Design

## Purpose
Replace the current procedural black-hole field lines with a softer, more believable light-sink effect for the portfolio hero. The new effect should preserve the Plasma Field / Orbital Map concept while making the black hole feel less like drawn streamlines and more like captured translucent light.

## Visual References
The direction is based on two generated reference frames:

- Reference A: a long amber light stream pulled from the left into a black-hole rim.
- Reference B: a clean dark event horizon with a strong warm accretion glow and smooth surrounding lensing.

The implementation should use Reference B as the idle shape and Reference A as the cursor interaction behavior.

## Target Look
- A clean dark circular event horizon, positioned on the right side of the hero.
- A warm amber-orange corona around the event horizon.
- A few broad translucent light ribbons curving around the black hole.
- Soft blur, screen/lighter blending, and layered radial gradients.
- A quiet dark background with enough empty space on the left for the hero text.
- Small golden specks only where they help sell captured light.

The effect should be stylized and web-renderable, not realistic astrophotography. It should look achievable with a 2D canvas, gradients, blur, and particles.

## Cursor Interaction
When the cursor moves:

- Small light particles or blobs are emitted near the cursor.
- The emitted light is pulled toward the black hole center.
- Paths curve around the event horizon instead of moving in straight lines.
- Particles stretch into short glowing trails as they accelerate.
- Light brightens slightly near the corona, then fades or disappears into the dark center.

The cursor should feel like it produces light that gravity captures. It should not become a large constant spotlight or cover the portfolio content.

## Motion Behavior
- Idle motion should be calm: slow breathing in the corona and subtle drift in the light ribbons.
- Cursor motion should be responsive but not chaotic.
- Captured particles should live briefly, roughly 1 to 2.5 seconds.
- The black hole should feel like the dominant force in the scene, but the portfolio project capsules must remain usable.
- Reduced-motion mode should keep a static warm halo and disable cursor-emitted particles.

## Implementation Direction
- Keep the existing `FieldCanvas` responsibility: one canvas behind the hero UI.
- Replace the current many-strand procedural field with:
  - a static/dynamic halo renderer,
  - a small set of translucent orbital ribbons,
  - a cursor-emitted particle system attracted to the black-hole center.
- Use simple 2D canvas math rather than WebGL for the first pass.
- Preserve the existing project capsule orbit behavior and readout behavior.
- Avoid adding a new dependency unless canvas performance becomes a blocker.

## Design Constraints
- Do not add a starfield.
- Do not use dense technical streamlines.
- Do not make the effect full photorealistic space art.
- Do not let the cursor effect obscure text, nav, readout, or project capsules.
- Do not change project content or routing as part of this visual pass.

## Acceptance Checks
- The idle black hole resembles the cleaner reference: dark center, warm corona, broad smooth glow.
- Moving the cursor creates light that curves inward and is absorbed.
- The left-side hero text remains readable.
- Project capsules remain visible and draggable.
- Reduced-motion users get a stable non-animated version.
- `npm run lint` and focused tests pass after implementation.
