# Project Card Scroll Reveal and Skill Stack Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Restore per-card project scroll reveal and refine card spacing plus hard/soft skill hierarchy.

**Architecture:** Extract the row reveal interpolation into a tiny testable helper, then use it inside `ProjectsPage` to set `--row-reveal` on visible project rows during scroll, resize, and filter changes. Keep the visual changes in `globals.css`: row gaps, larger bare logos, and a vertical hard-skills/logo/soft-skills stack.

**Tech Stack:** Next.js 16, React 19, TypeScript, Vitest, CSS custom properties, Playwright browser verification.

---

## File Structure

- Create `src/lib/project-row-reveal.ts`: pure helper for viewport-based reveal progress.
- Create `src/lib/project-row-reveal.test.ts`: Vitest coverage for reveal progress.
- Modify `src/components/projects/projects-page.tsx`: calculate per-row `--row-reveal`, update after filter changes, scroll, resize, and resize-observer height updates.
- Modify `src/app/globals.css`: apply row reveal styles, row gaps, larger bare logos, and vertical skill stack.

---

### Task 1: Row Reveal Helper

**Files:**
- Create: `src/lib/project-row-reveal.test.ts`
- Create: `src/lib/project-row-reveal.ts`

- [ ] **Step 1: Write the failing helper test**

Create `src/lib/project-row-reveal.test.ts`:

```ts
import { describe, expect, it } from "vitest";
import { projectRowReveal } from "./project-row-reveal";

describe("projectRowReveal", () => {
  it("is hidden before the row approaches the viewport", () => {
    expect(projectRowReveal({ rowTop: 900, viewportHeight: 800 })).toBe(0);
  });

  it("fades in while the row enters the viewport", () => {
    const reveal = projectRowReveal({ rowTop: 700, viewportHeight: 800 });
    expect(reveal).toBeGreaterThan(0);
    expect(reveal).toBeLessThan(1);
  });

  it("is fully visible once the row is comfortably inside the viewport", () => {
    expect(projectRowReveal({ rowTop: 500, viewportHeight: 800 })).toBe(1);
  });

  it("clamps invalid viewport heights to visible", () => {
    expect(projectRowReveal({ rowTop: 700, viewportHeight: 0 })).toBe(1);
  });
});
```

- [ ] **Step 2: Run the focused test and verify RED**

Run: `npm.cmd test -- src/lib/project-row-reveal.test.ts`

Expected: FAIL because `src/lib/project-row-reveal.ts` does not exist.

- [ ] **Step 3: Implement the helper**

Create `src/lib/project-row-reveal.ts`:

```ts
function clamp01(value: number) {
  return Math.min(Math.max(value, 0), 1);
}

function smoothstep01(value: number) {
  const c = clamp01(value);
  return c * c * (3 - 2 * c);
}

export function projectRowReveal({
  rowTop,
  viewportHeight,
}: {
  rowTop: number;
  viewportHeight: number;
}) {
  if (viewportHeight <= 0) return 1;

  const start = viewportHeight * 0.98;
  const end = viewportHeight * 0.72;
  return smoothstep01((start - rowTop) / (start - end));
}
```

- [ ] **Step 4: Run the focused test and verify GREEN**

Run: `npm.cmd test -- src/lib/project-row-reveal.test.ts`

Expected: PASS.

---

### Task 2: Project Page Reveal Wiring

**Files:**
- Modify: `src/components/projects/projects-page.tsx`

- [ ] **Step 1: Import the helper**

Add:

```ts
import { projectRowReveal } from "@/lib/project-row-reveal";
```

- [ ] **Step 2: Add a row reveal updater**

Inside `ProjectsPage`, add:

```ts
  function updateRowReveals() {
    if (!listRef.current) return;
    const rows = Array.from(listRef.current.querySelectorAll<HTMLElement>(".prj-row-wrap"));
    rows.forEach((wrap) => {
      if (wrap.style.display === "none") return;
      const reveal = projectRowReveal({
        rowTop: wrap.getBoundingClientRect().top,
        viewportHeight: window.innerHeight,
      });
      wrap.style.setProperty("--row-reveal", reveal.toFixed(4));
    });
  }
```

- [ ] **Step 3: Recalculate reveals after filtering**

In `handleFilter`, after the row display updates have been applied, call:

```ts
requestAnimationFrame(updateRowReveals);
```

- [ ] **Step 4: Recalculate reveals on page resize and scroll**

In the existing `useEffect`, call `updateRowReveals()` inside the resize-observer frame after updating `--projects-page-height`. Add window `scroll` and `resize` listeners for the reveal updater, and remove them in cleanup.

- [ ] **Step 5: Run the helper test**

Run: `npm.cmd test -- src/lib/project-row-reveal.test.ts`

Expected: PASS.

---

### Task 3: CSS Refinement

**Files:**
- Modify: `src/app/globals.css`

- [ ] **Step 1: Add list gap**

Change `.prj-list` to:

```css
.prj-list {
  display: flex;
  flex-direction: column;
  gap: 12px;
  opacity: var(--reveal-list, 0);
}
```

- [ ] **Step 2: Add row reveal styles**

Update `.prj-row-wrap`:

```css
.prj-row-wrap {
  max-width: 1120px;
  margin: 0 auto;
  padding: 0 48px;
  width: 100%;
  opacity: calc(0.22 + var(--row-reveal, 0) * 0.78);
  transform: translateY(calc((1 - var(--row-reveal, 0)) * 14px));
  transition:
    opacity 260ms ease,
    transform 260ms ease;
}
```

- [ ] **Step 3: Stack skills vertically**

Change `.prj-skills-row` to:

```css
.prj-skills-row {
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  gap: 12px;
}

.prj-skills-group + .prj-skills-group {
  padding-top: 0;
}
```

- [ ] **Step 4: Make logos larger and remove boxes**

Change the logo styles to:

```css
.prj-skill-logo-strip {
  display: flex;
  flex-wrap: wrap;
  gap: 12px;
  margin-top: 8px;
}

.prj-skill-logo-tile {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 42px;
  height: 30px;
  padding: 0;
  border: 0;
  background: transparent;
}
```

- [ ] **Step 5: Preserve reduced-motion accessibility**

Inside the existing reduced-motion media block, add:

```css
.prj-row-wrap {
  opacity: 1 !important;
  transform: none !important;
}
```

- [ ] **Step 6: Run the helper test**

Run: `npm.cmd test -- src/lib/project-row-reveal.test.ts`

Expected: PASS.

---

### Task 4: Verification and Commit

**Files:**
- Verify: `http://127.0.0.1:5176`

- [ ] **Step 1: Run full tests**

Run: `npm.cmd test`

Expected: PASS.

- [ ] **Step 2: Run production build**

Run: `npm.cmd run build`

Expected: PASS.

- [ ] **Step 3: Browser verify**

Use Playwright to verify:

```txt
9 project rows render
row reveal values increase after scrolling down
.prj-list gap is 12px
.prj-skill-logo-tile border is 0px
.prj-skill-logo-tile width is 42px
soft skills appear below the first logo strip
mobile first project row has no horizontal overflow
```

- [ ] **Step 4: Commit**

Run:

```bash
git add src/lib/project-row-reveal.ts src/lib/project-row-reveal.test.ts src/components/projects/projects-page.tsx src/app/globals.css
git commit -m "feat: restore project card scroll reveal"
```
