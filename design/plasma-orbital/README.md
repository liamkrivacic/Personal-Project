# Plasma Orbital Prototype

Standalone prototype for Liam Krivacic's Plasma Field / Orbital Map portfolio direction.

## Open

Serve the repository root, then open the prototype route:

```powershell
python -m http.server 5174 --bind 127.0.0.1
```

```text
http://127.0.0.1:5174/design/plasma-orbital/index.html
```

The local server is recommended because browser ES modules need a JavaScript MIME type.

## Test

```powershell
node --test design/plasma-orbital/orbit-model.test.mjs
```

Expected result: 4 passing tests.

## Interaction Checklist

- Project capsules orbit a black-hole-like center.
- Clicking or focusing a capsule updates the lower readout.
- Dragging detaches a capsule from orbit.
- Releasing with movement throws the capsule.
- The capsule slowly returns to orbit.
- Fast signal traces appear infrequently and fade quickly.
- Reduced-motion mode removes signal animations.

## Design Notes

This prototype should stay close to the approved localhost mockup:

- Dark technical background.
- Large `Liam Builds Systems` hero type.
- Compact project capsules.
- Black-hole field source, not Liam's name in the center.
- Rare fast light trails.
- No strong constant cursor glow.
