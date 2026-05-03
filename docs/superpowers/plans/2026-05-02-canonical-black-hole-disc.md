# Canonical Black-Hole Disc Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace the remaining top/side visual split with one canonical Interstellar-style accretion model.

**Architecture:** Keep the existing WebGL shader, drag orbit, fluid simulation, and scroll/dive integration. Refactor only the accretion-field composition so camera angle affects projection and visibility, not ring identity or brightness recipes.

**Tech Stack:** Next.js, TypeScript, Vitest source guardrails, Playwright visual/runtime checks, WebGL2 GLSL shader in `public/black-hole-fluid/fluid.js`.

---

### Task 1: Guardrail Tests

**Files:**
- Modify: `src/lib/black-hole-fluid-shader.test.ts`
- Read: `CODEX.md`

- [x] Add tests that require the canonical single-model rule in `CODEX.md`.
- [x] Add shader tests that reject `horizontalDiscBand`, `sideViewBeam`, side-weighted ring radius/width recipes, and side-weighted wrap brightness.
- [x] Run `npx vitest run src/lib/black-hole-fluid-shader.test.ts` and confirm the tests fail on the current shader.

### Task 2: Canonical Shader Refactor

**Files:**
- Modify: `public/black-hole-fluid/fluid.js`

- [ ] Replace view-weighted radii with canonical radii derived from one `shadowRadius`.
- [ ] Keep `sideView` only for projection/coordinate blending and visibility.
- [ ] Remove `horizontalDiscBand`, `sideViewBeam`, and side-specific wrap/ring boost formulas.
- [ ] Preserve Interstellar cues: bright photon ring, warm lensed wrap, broad amber outer swirl, compact black event shadow, drag response.

### Task 3: Cache and Verification

**Files:**
- Modify: `public/black-hole-fluid/index.html`
- Modify: `src/components/orbital/orbital-hero.tsx`

- [ ] Bump the cache key to `scroll-dive-cinematic-31`.
- [ ] Capture top, side, drag, and dive screenshots.
- [ ] Run `npm test`, `npm run lint`, `npm run build`, `npm run test:fluid`, and `git diff --check`.
- [ ] Restart the local dev server on port `5176`.
