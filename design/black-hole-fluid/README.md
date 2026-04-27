# Black Hole Fluid Prototype

Desktop-only WebGL2 material prototype for the portfolio black-hole effect.

## Open

Serve the repository root:

```powershell
python -m http.server 5174 --bind 127.0.0.1
```

Then open:

```text
http://127.0.0.1:5174/design/black-hole-fluid/index.html
```

## Goal

This prototype tests a procedural fluid/heat-field approach before integrating anything into the Next.js portfolio.

- No generated image base.
- No project capsules.
- No mobile fallback yet.
- Cursor movement releases speed-sensitive light streamlets with subtle perpendicular wavefronts.
- The rim source uses rotating spiral bands, pulsing circumference glow, and orbital retention.
- The event horizon absorbs the center.
- Controls tune rim feed, swirl, pull, cursor heat, and persistence.

## Evaluation

Use this only to decide whether the material direction feels right on desktop. If it works, port the WebGL renderer into the portfolio hero as a replacement for the current canvas field.
