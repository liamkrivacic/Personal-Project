# Recruiter Project Cards Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace the current four project cards with eight recruiter-focused cards sourced from Liam's provided documents, and create a markdown draft for future project detail pages.

**Architecture:** Keep the existing project page styling and card structure. Update the data module, add small filter values for `Infrastructure` and `Creative`, extend the inline SVG/image switch only enough to display supported project imagery, and add a separate case-study draft document.

**Tech Stack:** Next.js 16, React 19, TypeScript, Vitest.

---

### Task 1: Add Project Data Contract Coverage

**Files:**
- Create: `src/data/projects.test.ts`

- [ ] **Step 1: Write tests for the new project list**

```ts
import { describe, expect, it } from "vitest";
import { projects } from "./projects";

describe("projects data", () => {
  it("contains the eight recruiter project cards from the approved spec", () => {
    expect(projects.map((project) => project.id)).toEqual([
      "atomcraft-rf-leadership",
      "hfss-coupler-coax",
      "stub-tuner-optimisation",
      "hv-magnetron-supply",
      "fmcg-nas-infrastructure",
      "fmcg-wordpress-marketing",
      "sumobot-winner",
      "visual-arts-portfolio",
    ]);
  });

  it("keeps every card recruiter-ready without empty content", () => {
    for (const project of projects) {
      expect(project.title.length).toBeGreaterThan(8);
      expect(project.signal.length).toBeGreaterThan(80);
      expect(project.hard.length).toBeGreaterThanOrEqual(3);
      expect(project.soft.length).toBeGreaterThanOrEqual(3);
      expect(project.img.length).toBeGreaterThan(0);
    }
  });
});
```

- [ ] **Step 2: Run the focused test and confirm it fails before implementation**

Run: `npm.cmd test -- src/data/projects.test.ts`

Expected: FAIL because the current data still contains the old four cards.

### Task 2: Replace Project Data

**Files:**
- Modify: `src/data/projects.ts`

- [ ] **Step 1: Extend the type union without changing the rendered card style**

Use:

```ts
export type ProjectType =
  | "rf"
  | "robotics"
  | "software"
  | "hardware"
  | "infrastructure"
  | "creative";
```

- [ ] **Step 2: Replace the project array with the eight approved cards**

Use recruiter-facing titles, blurbs, skills, and image ids supported by the approved design spec.

- [ ] **Step 3: Run the focused data test**

Run: `npm.cmd test -- src/data/projects.test.ts`

Expected: PASS.

### Task 3: Update Filters And Card Art References

**Files:**
- Modify: `src/components/projects/projects-page.tsx`
- Create: `public/projects/sumobot-chassis.png`
- Create: `public/projects/artwork-collection.png`

- [ ] **Step 1: Copy supported local images into `public/projects/`**

Copy:

```powershell
Copy-Item -LiteralPath "C:\Users\krili\OneDrive - UNSW\UNSW\2024\2024 term 2\SumoBot\Chasis\Chasis v16.png" -Destination "public\projects\sumobot-chassis.png"
```

Copy one visually checked local artwork image from `C:\Users\krili\OneDrive - UNSW\UNSW\Art` to `public\projects\artwork-collection.png`.

- [ ] **Step 2: Keep the existing filter bar style and add only data categories**

Set type filters to:

```ts
[
  { val: "all", label: "All" },
  { val: "rf", label: "RF / Microwave" },
  { val: "software", label: "Software / Web" },
  { val: "hardware", label: "Hardware" },
  { val: "infrastructure", label: "Infrastructure" },
  { val: "robotics", label: "Robotics" },
  { val: "creative", label: "Creative" },
]
```

- [ ] **Step 3: Add image rendering support without CSS changes**

Keep inline SVG symbols for RF, infrastructure, web, and hardware cards. Add a conditional renderer so `img` values beginning with `/` render an `<image>` element inside the existing card `<svg>` frame.

- [ ] **Step 4: Run TypeScript/build verification**

Run: `npm.cmd run build`

Expected: PASS.

### Task 4: Write Future Case-Study Drafts

**Files:**
- Create: `docs/project-case-study-drafts.md`

- [ ] **Step 1: Add a section for each approved project**

Each section must include:

```md
## Recruiter-Facing Title

**Card blurb:** ...

**Skills:** ...

**Future page draft:** ...

**Evidence used:** ...

**Source limits:** ...
```

- [ ] **Step 2: Keep unsupported claims out**

Do not claim production deployment scale, quantified business impact, or project outcomes unless one of the approved source files supports it.

### Task 5: Final Verification

**Files:**
- Verify all changed source, docs, and copied assets.

- [ ] **Step 1: Run tests**

Run: `npm.cmd test`

Expected: PASS.

- [ ] **Step 2: Run production build**

Run: `npm.cmd run build`

Expected: PASS.

- [ ] **Step 3: Confirm the dev server is running**

Run a local HTTP check against `http://127.0.0.1:5176`.

Expected: status code `200`.

- [ ] **Step 4: Commit implementation**

Stage only the implementation files and commit with:

```bash
git commit -m "feat: add recruiter project cards"
```

