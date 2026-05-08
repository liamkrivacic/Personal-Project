# Project Card Inline Skill Logo Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Move hard-skill logos into their matching skill pills and shorten project cards by constraining the desktop media area height.

**Architecture:** Keep project data unchanged. Update `ProjectsPage` markup so each hard-skill pill contains its logo image, remove the separate logo strip, and tune CSS so the card row has a compact height while the thumbnail still fills the dedicated image column with `object-fit: cover`.

**Tech Stack:** Next.js 16, React 19, TypeScript, CSS, Vitest, Playwright browser verification.

---

## File Structure

- Modify `src/components/projects/projects-page.tsx`: render each hard-skill logo inside its hard-skill pill.
- Modify `src/app/globals.css`: remove separate logo-strip styling, style inline skill logos, cap desktop image/card height, keep mobile stable.
- Create `src/lib/project-card-layout-source.test.ts`: source-level guard for inline logos and compact media CSS.

---

### Task 1: Regression Test

**Files:**
- Create: `src/lib/project-card-layout-source.test.ts`

- [ ] **Step 1: Write failing source-level test**

Create a test that reads `ProjectsPage` and `globals.css` and verifies:

```txt
no prj-skill-logo-strip class remains in ProjectsPage
hard skill pills contain an img using skill.logo and skill.logoAlt
CSS defines inline .prj-skill-logo styling
CSS constrains .prj-row-img height to 100% and .prj-row to 210px max-height/height
```

- [ ] **Step 2: Run RED**

Run: `npm.cmd test -- src/lib/project-card-layout-source.test.ts`

Expected: FAIL because the current component still renders `.prj-skill-logo-strip`.

---

### Task 2: Markup and CSS

**Files:**
- Modify: `src/components/projects/projects-page.tsx`
- Modify: `src/app/globals.css`

- [ ] **Step 1: Update markup**

Inside each hard skill pill, render:

```tsx
<span>{skill.label}</span>
<img className="prj-skill-logo" src={skill.logo} alt={skill.logoAlt} />
```

Remove `.prj-skill-logo-strip` and `.prj-skill-logo-tile` markup.

- [ ] **Step 2: Update desktop CSS**

Set the row to a compact fixed desktop height:

```css
.prj-row {
  height: 210px;
  min-height: 0;
}
```

Keep `.prj-row-img` at `width: 100%; height: 100%; object-fit: cover;`.

- [ ] **Step 3: Update skill CSS**

Style inline logos:

```css
.prj-skill-pill.hard {
  gap: 7px;
}

.prj-skill-logo {
  display: block;
  width: 18px;
  height: 18px;
  object-fit: contain;
}
```

Remove separate logo strip/tile styles.

- [ ] **Step 4: Run focused test GREEN**

Run: `npm.cmd test -- src/lib/project-card-layout-source.test.ts`

Expected: PASS.

---

### Task 3: Verification and Commit

**Files:**
- Verify: `http://127.0.0.1:5176`

- [ ] **Step 1: Run all tests**

Run: `npm.cmd test`

Expected: PASS.

- [ ] **Step 2: Run build**

Run: `npm.cmd run build`

Expected: PASS. If `.next` is locked by the dev server, stop only this project’s Next/npm Node processes, build, then restart the dev server on port `5176`.

- [ ] **Step 3: Browser verify**

Use Playwright to verify:

```txt
9 project rows render
first image column remains 310px wide
desktop project image height is near 210px and object-fit is cover
hard-skill pill contains an inline logo image
no .prj-skill-logo-strip exists
soft skills are below hard skills
mobile has no horizontal overflow
```

- [ ] **Step 4: Commit**

Run:

```bash
git add src/lib/project-card-layout-source.test.ts src/components/projects/projects-page.tsx src/app/globals.css
git commit -m "feat: compact project cards with inline skill logos"
```
