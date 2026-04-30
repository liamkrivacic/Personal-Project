# Personal Portfolio

Next.js portfolio site for Liam Krivacic. The current checkpoint is built around a cinematic black-hole scroll dive that hands off into a post-dive project journey.

## Run Locally

```powershell
npm install
npm run dev -- --hostname 127.0.0.1 --port 5176
```

Then open `http://127.0.0.1:5176`.

## Useful Commands

```powershell
npm test
npm run test:fluid
npm run lint
npm run build
```

## Current Direction

- The first screen is the interactive black-hole hero in `public/black-hole-fluid`.
- `src/components/orbital/orbital-hero.tsx` maps wheel/touch input to the shader dive.
- `src/components/projects/project-journey.tsx` owns the post-dive project sequence.
- The next visual task is documented in `docs/2026-04-28-black-hole-status.md`: improve the black-hole side-view disc so the horizontal band connects and flows into the outer accretion disc.
