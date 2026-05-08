# Project Cards Refinement Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Refine the project cards with a single focus filter, real thumbnails, a personal website project, recruiter-friendly ordering, and compact hard-skill marks.

**Architecture:** Keep the existing project page and card layout. Move filtering to a single `focus` field in the project data, make every thumbnail a `/projects/*.png` asset, render hard skills from structured `{ label, icon }` objects, and keep the future-page image references in the case-study draft document.

**Tech Stack:** Next.js 16, React 19, TypeScript, Vitest, Playwright for visual checks.

---

### Task 1: Update Project Data Tests

**Files:**
- Modify: `src/data/projects.test.ts`

- [ ] **Step 1: Replace the current tests with the refined contract**

```ts
import { describe, expect, it } from "vitest";
import { projects } from "./projects";

describe("projects data", () => {
  it("orders the nine refined project cards with project work first", () => {
    expect(projects.map((project) => project.id)).toEqual([
      "hfss-coupler-coax",
      "stub-tuner-optimisation",
      "hv-magnetron-supply",
      "sumobot-winner",
      "nas-infrastructure",
      "wordpress-marketing",
      "atomcraft-rf-leadership",
      "personal-website-black-hole",
      "visual-arts-portfolio",
    ]);
  });

  it("uses the approved single focus taxonomy", () => {
    expect(new Set(projects.map((project) => project.focusLabel))).toEqual(
      new Set([
        "Electrical Engineering",
        "Software & Computer Science",
        "Personal & Creative",
      ]),
    );
  });

  it("keeps headings clean and every card recruiter-ready", () => {
    for (const project of projects) {
      expect(project.title).not.toMatch(/\bFMCG\b/);
      expect(project.title.length).toBeGreaterThan(8);
      expect(project.signal.length).toBeGreaterThan(80);
      expect(project.hard.length).toBeGreaterThanOrEqual(3);
      expect(project.soft.length).toBeGreaterThanOrEqual(3);
      expect(project.img).toMatch(/^\/projects\/.+\.png$/);
    }
  });

  it("adds compact marks to at least one hard skill on every card", () => {
    for (const project of projects) {
      expect(project.hard.some((skill) => skill.icon)).toBe(true);
    }
  });
});
```

- [ ] **Step 2: Run the focused test and confirm it fails**

Run: `npm.cmd test -- src/data/projects.test.ts`

Expected: FAIL because production data still has the previous eight-card shape and ordering.

### Task 2: Create Real Thumbnail Assets

**Files:**
- Create/modify images under: `public/projects/`

- [ ] **Step 1: Extract selected embedded images from Liam's own Word docs**

Use a PowerShell extraction script to pull selected `word/media/*` images from these local documents:

- `Atomcraft/RF/Final Report z5592360.docx`
- `Atomcraft/RF/Power Measurement/Main/Experimental Design.docx`
- `Atomcraft/RF/Enclosure/Enclosure.docx`

- [ ] **Step 2: Create card-ready thumbnails**

Create these real thumbnail assets:

```text
public/projects/rf-coupler-coax.png
public/projects/stub-tuner-hfss.png
public/projects/hv-magnetron-enclosure.png
public/projects/sumobot-chassis.png
public/projects/nas-infrastructure.png
public/projects/wordpress-marketing.png
public/projects/atomcraft-rf-leadership.png
public/projects/personal-website-black-hole.png
public/projects/artwork-collection.png
```

Use local CAD/HFSS/enclosure images for the AtomCraft cards, the existing SumoBot/artwork local images, a screenshot of `industrialfootbath.com.au` for the website/NAS work thumbnails, and a fresh local screenshot of this portfolio for the personal website card.

### Task 3: Refine Project Data

**Files:**
- Modify: `src/data/projects.ts`

- [ ] **Step 1: Replace the project types with the focus data model**

Use:

```ts
export type ProjectFocus = "electrical" | "software" | "personal";

export type ProjectSkill = {
  label: string;
  icon?: string;
};
```

- [ ] **Step 2: Replace the project array**

Use the nine-card order from Task 1, assign one `focus` and `focusLabel` to each project, remove `FMCG` from the two work project headings, and make every `img` point to a `/projects/*.png` thumbnail.

- [ ] **Step 3: Run the focused data test**

Run: `npm.cmd test -- src/data/projects.test.ts`

Expected: PASS.

### Task 4: Update Project Page Rendering

**Files:**
- Modify: `src/components/projects/projects-page.tsx`
- Modify: `src/app/globals.css`

- [ ] **Step 1: Remove the hidden synthetic SVG symbol thumbnails**

Delete the `<svg style={{ display: "none" }}>...</svg>` symbol definitions because the refined cards use real image assets.

- [ ] **Step 2: Replace two-axis filtering with a single focus filter**

Use one state value:

```ts
const [activeFocus, setActiveFocus] = useState<string>("all");
```

Render these filter pills:

```ts
[
  { val: "all", label: "All" },
  { val: "electrical", label: "Electrical Engineering" },
  { val: "software", label: "Software & Computer Science" },
  { val: "personal", label: "Personal & Creative" },
]
```

- [ ] **Step 3: Render thumbnails from image paths**

Render each image with the existing SVG frame:

```tsx
<image href={p.img} width="280" height="148" preserveAspectRatio="xMidYMid slice" />
```

- [ ] **Step 4: Render hard-skill marks**

For hard skills, render `skill.icon` inside a small `.prj-skill-logo` span before the text. Leave soft skills text-only.

- [ ] **Step 5: Add small CSS for skill marks and new badge classes**

Add `.prj-skill-logo`, `.prj-cat-badge.engineering`, and `.prj-cat-badge.personal` rules without changing the overall card layout.

### Task 5: Update Future Case-Study Drafts

**Files:**
- Modify: `docs/project-case-study-drafts.md`

- [ ] **Step 1: Rename the two FMCG sections**

Rename:

```text
FMCG NAS and Self-Hosted Web Infrastructure -> NAS and Self-Hosted Web Infrastructure
FMCG WordPress Websites and Marketing Systems -> WordPress Websites and Marketing Systems
```

- [ ] **Step 2: Add the personal website section**

Add `## Personal Website and Black-Hole Interface` with supported facts from the repo.

- [ ] **Step 3: Add image candidate notes**

For each section, add `**Relevant image candidates:**` listing local image candidates and source paths for future detail pages.

### Task 6: Full Verification And Commit

**Files:**
- Verify all changed source, docs, and image assets.

- [ ] **Step 1: Run focused data test**

Run: `npm.cmd test -- src/data/projects.test.ts`

Expected: PASS.

- [ ] **Step 2: Run full Vitest suite**

Run: `npm.cmd test`

Expected: PASS.

- [ ] **Step 3: Run production build**

Run: `npm.cmd run build`

Expected: PASS. If `.next` is locked by the dev server, stop only this workspace's Next dev Node processes, rerun the build, and restart the dev server on port `5176`.

- [ ] **Step 4: Inspect the rendered project page**

Use Playwright to verify that:

- There are 9 project titles.
- The first title is `HFSS Directional Coupler and Coax Adapter`.
- The focus filter labels are exactly `All`, `Electrical Engineering`, `Software & Computer Science`, and `Personal & Creative`.
- Each focus filter shows the expected cards.

- [ ] **Step 5: Commit implementation**

Stage only source/docs/project assets and commit:

```bash
git commit -m "feat: refine project cards"
```

