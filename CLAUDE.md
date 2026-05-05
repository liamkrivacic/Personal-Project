# CLAUDE.md

**Liam Krivacic - Personal Portfolio Website**
Stack: Next.js 16 (App Router) + React 19 + TypeScript + Tailwind CSS -> Vercel
Current focus: checkpoint 15 — tsBXW3 black-hole promoted to main page.

## Session Memory
Vault: `C:/Users/krili/OneDrive - UNSW/UNSW/Obsidian Vault/Claude/projects/liam-portfolio/`
- Run `/start` at the beginning of each session to load project context
- Run `/save` before ending any session
- When looking for anything in the vault mid-session, read the index first: `Obsidian Vault/Claude/_index.md`

## Commands
- `npm run dev -- --hostname 127.0.0.1 --port 5176` - local dev server used for visual checks
- `npm run build` - production build
- `npm run lint` - lint
- `npm test` - Vitest shader/string behavior tests
- `npm run test:fluid` - Playwright visual/runtime smoke tests

## Current Runtime
- Hero shell: `src/components/orbital/orbital-hero-tsbxw3.tsx`
- Black-hole shader runtime: `public/black-hole-tsbxw3/index.html` and `public/black-hole-tsbxw3/fluid.js`
- Cursor trail overlay: `public/black-hole-cursor-streamlets/fluid.js`
- Post-dive project section: `src/components/projects/project-journey.tsx`

## Rules
- TypeScript strict mode
- Functional components, named exports, early returns
- Never commit `.env.local`
- Ask before force-push or destructive git operations
- Do not rewrite GitHub checkpoint 9; make new work as local changes/branches/checkpoints.
