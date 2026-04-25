# Next.js Portfolio App Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Scaffold the production Next.js portfolio app and port the approved Plasma Orbital prototype into typed app components.

**Architecture:** Keep the static prototype in `design/plasma-orbital/` as a reference. Add a root Next.js 15 app using Server Components by default, with one small client component for the orbital interaction and a pure tested physics module.

**Tech Stack:** Next.js 16.2.4, React 19, TypeScript, Tailwind CSS 3, shadcn-compatible utilities, Vitest 4.

---

## File Structure

- Create root app/tooling files: `package.json`, `tsconfig.json`, `next.config.ts`, `postcss.config.mjs`, `tailwind.config.cjs`, `eslint.config.mjs`, `next-env.d.ts`, `components.json`.
- Create app files: `src/app/layout.tsx`, `src/app/page.tsx`, `src/app/globals.css`.
- Create interaction files: `src/components/orbital/orbital-hero.tsx`, `src/lib/orbit-model.ts`, `src/lib/orbit-model.test.ts`, `src/data/projects.ts`, `src/lib/utils.ts`.

## Tasks

- [x] Create package/config files and install dependencies.
- [x] Write failing Vitest tests for the orbital physics model.
- [x] Implement the TypeScript orbital physics model until tests pass.
- [x] Add project data and shadcn-compatible `cn` helper.
- [x] Build the homepage and interactive orbital client component.
- [x] Run `npm test`, `npm run lint`, and `npm run build`.
- [x] Start the dev server and verify the page renders locally.
- [ ] Commit, push, merge to `main`, and clean up the worktree.

## Verification

Required commands:

```powershell
npm test
npm run lint
npm run build
```

Manual/browser checks:

- Homepage shows `Liam Builds Systems`.
- Four compact project capsules render around a black-hole field source.
- Clicking/focusing capsules updates the readout.
- Dragging and throwing a capsule returns it to orbit.
- Mobile layout keeps text and capsules inside the viewport.
