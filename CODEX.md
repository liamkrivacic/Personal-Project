# CODEX.md

**Liam Krivacic - Personal Portfolio Website**
Stack: Next.js 16 (App Router) + React 19 + TypeScript + Tailwind CSS -> Vercel
Current focus: checkpoint 9 black-hole scroll dive plus the post-dive project journey.

## Session Memory
Vault: `C:/Users/krili/OneDrive - UNSW/UNSW/Obsidian Vault/Claude/projects/liam-portfolio/`
- Use the `codex-start` skill at the beginning of each session to load project context
- Use the `codex-save` skill before ending any session
- When looking for anything in the vault mid-session, read the index first: `Obsidian Vault/Claude/_index.md`
- Use targeted reads/searches only; do not load entire vault directories

## Commands
- `npm run dev -- --hostname 127.0.0.1 --port 5176` - local dev server used for visual checks
- `npm run build` - production build
- `npm run lint` - lint
- `npm test` - Vitest shader/string behavior tests
- `npm run test:fluid` - Playwright visual/runtime smoke tests

## Current Runtime
- Hero shell: `src/components/orbital/orbital-hero.tsx`
- Black-hole shader runtime: `public/black-hole-fluid/index.html` and `public/black-hole-fluid/fluid.js`
- Post-dive project section: `src/components/projects/project-journey.tsx`
- Next black-hole task: `docs/2026-04-28-black-hole-status.md`

## Rules
- TypeScript strict mode
- Functional components, named exports, early returns
- Never commit `.env.local`
- Ask before force-push or destructive git operations
- Read files before editing them
- Prefer root-cause fixes over fragile workarounds
- Do not rewrite GitHub checkpoint 9; make new work as local changes/branches/checkpoints.

## Codex Setup
- MCP configured: `obsidian`, `awesome-design-md`
- MCP not needed right now: `figma`
- Local Codex skills mirrored from Claude custom commands: `codex-start`, `codex-save`, `codex-search`, `codex-lint`, `codex-new-project`, `codex-configure`, `codex-skill-update`
- Additional Codex skills installed from the Claude setup notes: `frontend-design`, `pro-workflow`, `taste-skill`, `ui-ux-pro-max`, Superpowers workflow skills, Next.js/React toolkit skills

## Black-Hole Shader Direction

The black hole must be rendered as one canonical accretion model. Words like "top view" and "side view" are only camera-angle descriptions used while debugging; they must not become separate shader modes, separate ring recipes, or separate visual layers.

For the Interstellar-style black hole:

- The event shadow, photon ring, accretion disc, lens wrap, and broad swirl should share one set of canonical radii and brightness rules.
- Camera angle may change projection, foreshortening, parallax, and which parts of the disc are visible.
- Camera angle must not change the identity of the rim, swap in a side-only band, or boost a different outer ring just because the view is edge-on.
- The accretion disc coordinate system should come from the ray-disc intersection coordinates. Projected edge-on bands may shape visibility, lensing, and compression, but they must not define the spiral radius or angle.
- Avoid adding new corrective layers on top of old ones. If a visual term exists only to patch a specific view, delete or fold it back into the canonical disc model.
- The cursor light streamlets and scroll/dive choreography should remain intact unless a requested black-hole change explicitly requires touching them.
