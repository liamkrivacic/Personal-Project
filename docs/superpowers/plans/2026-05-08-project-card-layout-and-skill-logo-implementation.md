# Project Card Layout and Skill Logo Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Update the project cards to use the approved wider image layout, cropped thumbnails, recruiter-clean hard skills, and a separate row of real software/tool logos.

**Architecture:** Keep the current single data source in `src/data/projects.ts`, extending project records with image framing and local logo paths. The React component stays responsible only for rendering the data, while CSS owns the wider desktop grid, image cropping, and skill/logo spacing.

**Tech Stack:** Next.js 16 App Router, React 19, TypeScript, Vitest, CSS, local SVG/PNG assets under `public/`.

---

## File Structure

- Modify `src/data/projects.ts`: change `ProjectSkill` from inline text marks to local logo metadata, add `imagePosition`, clean hard-skill labels, and omit hard skills for projects without sourced software/tool evidence.
- Modify `src/data/projects.test.ts`: add tests for the approved hard-skill vocabulary, removed labels, local logo paths, and conditional logo data.
- Modify `src/components/projects/projects-page.tsx`: replace SVG thumbnail embedding with cropped image rendering, render hard-skill logos below hard-skill pills, and hide an empty hard-skill group.
- Modify `src/app/globals.css`: widen project containers, set the desktop grid to `56px 310px 1fr`, shorten row minimum height to `178px`, set `object-fit: cover`, and style the separate logo strip.
- Create `public/skill-logos/*.svg`: local logo files for the hard skills that appear on cards.

---

### Task 1: Data Tests

**Files:**
- Modify: `src/data/projects.test.ts`

- [ ] **Step 1: Write failing tests for hard-skill cleanup and logo metadata**

Replace the existing "adds compact marks" test with tests equivalent to:

```ts
const approvedHardSkills = new Set([
  "ANSYS HFSS",
  "IronPython",
  "Python",
  "LTspice",
  "Fusion 360",
  "Arduino",
  "C/C++",
  "Synology DSM",
  "WordPress",
  "PHP",
  "Mailchimp",
  "Next.js",
  "React",
  "TypeScript",
  "WebGL",
]);

const removedHardSkillLabels = [
  "WR340 waveguide",
  "S-parameters",
  "VNA planning",
  "Gradient descent",
  "Impedance matching",
  "4 kV HV safety",
  "Enclosure design",
  "Ultrasonic sensors",
  "RAID",
  "Reverse proxy",
  "SSL certificates",
  "RF systems",
  "Safety docs",
  "Visual composition",
  "Concept development",
  "Presentation",
  "Iteration",
];

it("limits hard skills to recruiter-facing software, languages, and tools", () => {
  const hardSkillLabels = projects.flatMap((project) =>
    project.hard.map((skill) => skill.label),
  );

  for (const label of hardSkillLabels) {
    expect(approvedHardSkills.has(label)).toBe(true);
  }

  for (const removed of removedHardSkillLabels) {
    expect(hardSkillLabels).not.toContain(removed);
  }
});

it("uses local logo image assets instead of inline text marks", () => {
  for (const project of projects) {
    for (const skill of project.hard) {
      expect(skill.logo).toMatch(/^\/skill-logos\/.+\.svg$/);
      expect(skill.logoAlt).toContain(skill.label);
      expect(skill).not.toHaveProperty("icon");
    }
  }
});

it("stores explicit thumbnail crop positions", () => {
  for (const project of projects) {
    expect(project.imagePosition).toMatch(/^(left|center|right|\d+%) (top|center|bottom|\d+%)$/);
  }
});
```

- [ ] **Step 2: Run the focused data tests and verify RED**

Run: `npm.cmd test -- src/data/projects.test.ts`

Expected: FAIL because `logo`, `logoAlt`, and `imagePosition` are not implemented and existing hard-skill labels include removed concepts.

---

### Task 2: Project Data

**Files:**
- Modify: `src/data/projects.ts`
- Create: `public/skill-logos/*.svg`

- [ ] **Step 1: Update data types**

Change:

```ts
export type ProjectSkill = {
  label: string;
  icon?: string;
};
```

To:

```ts
export type ProjectSkill = {
  label: string;
  logo: string;
  logoAlt: string;
};
```

Add this field to `Project`:

```ts
imagePosition: string;
```

- [ ] **Step 2: Clean each card's hard skills**

Use this supported hard-skill set:

```ts
hfss-coupler-coax: ["ANSYS HFSS"]
stub-tuner-optimisation: ["IronPython", "ANSYS HFSS"]
hv-magnetron-supply: ["LTspice", "Fusion 360"]
sumobot-winner: ["Arduino", "C/C++", "Fusion 360"]
nas-infrastructure: ["Synology DSM", "WordPress"]
wordpress-marketing: ["WordPress", "PHP", "Python", "Mailchimp"]
atomcraft-rf-leadership: ["ANSYS HFSS", "LTspice", "Fusion 360"]
personal-website-black-hole: ["Next.js", "React", "TypeScript", "WebGL"]
visual-arts-portfolio: []
```

Set logo metadata like:

```ts
{ label: "ANSYS HFSS", logo: "/skill-logos/ansys.svg", logoAlt: "ANSYS HFSS logo" }
```

- [ ] **Step 3: Add image positions**

Use:

```ts
hfss-coupler-coax: "center center"
stub-tuner-optimisation: "center center"
hv-magnetron-supply: "center center"
sumobot-winner: "center center"
nas-infrastructure: "center center"
wordpress-marketing: "center top"
atomcraft-rf-leadership: "center center"
personal-website-black-hole: "center center"
visual-arts-portfolio: "center center"
```

- [ ] **Step 4: Add logo assets**

Create these local files:

```txt
public/skill-logos/ansys.svg
public/skill-logos/python.svg
public/skill-logos/ltspice.svg
public/skill-logos/fusion360.svg
public/skill-logos/arduino.svg
public/skill-logos/cplusplus.svg
public/skill-logos/synology.svg
public/skill-logos/wordpress.svg
public/skill-logos/php.svg
public/skill-logos/mailchimp.svg
public/skill-logos/nextdotjs.svg
public/skill-logos/react.svg
public/skill-logos/typescript.svg
public/skill-logos/webgl.svg
```

Use local copies downloaded from online brand/icon sources. Use the Python logo for `IronPython`, the Fusion 360 logo for `Fusion 360`, and the ANSYS logo for `ANSYS HFSS`.

- [ ] **Step 5: Run focused data tests and verify GREEN**

Run: `npm.cmd test -- src/data/projects.test.ts`

Expected: PASS for project data tests.

---

### Task 3: Card Rendering and CSS

**Files:**
- Modify: `src/components/projects/projects-page.tsx`
- Modify: `src/app/globals.css`

- [ ] **Step 1: Replace SVG thumbnail wrapper with cropped image**

Change the thumbnail render to:

```tsx
<img
  className="prj-row-img"
  src={p.img}
  alt=""
  aria-hidden="true"
  style={{ objectPosition: p.imagePosition }}
/>
```

- [ ] **Step 2: Render hard-skill logos below hard-skill pills**

Render hard skills only when present:

```tsx
{p.hard.length > 0 ? (
  <div className="prj-skills-group">
    <span className="prj-skills-group-label">Hard skills</span>
    <div className="prj-skills-pills">
      {p.hard.map((skill) => (
        <span key={skill.label} className="prj-skill-pill hard">
          {skill.label}
        </span>
      ))}
    </div>
    <div className="prj-skill-logo-strip" aria-label="Software and tool logos">
      {p.hard.map((skill) => (
        <span key={`${skill.label}-logo`} className="prj-skill-logo-tile">
          <img src={skill.logo} alt={skill.logoAlt} />
        </span>
      ))}
    </div>
  </div>
) : null}
```

- [ ] **Step 3: Update CSS geometry and spacing**

Set the desktop card geometry:

```css
.prj-col,
.prj-row-wrap {
  max-width: 1120px;
}

.prj-row {
  grid-template-columns: 56px 310px 1fr;
  min-height: 178px;
}

.prj-row-body {
  padding: 22px 0 22px 40px;
}

.prj-row-img {
  display: block;
  width: 100%;
  height: 100%;
  object-fit: cover;
}
```

Replace inline skill-mark styling with a logo strip:

```css
.prj-skill-logo-strip {
  display: flex;
  flex-wrap: wrap;
  gap: 7px;
  margin-top: 7px;
}

.prj-skill-logo-tile {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 28px;
  height: 24px;
  padding: 4px;
  border: 1px solid rgba(162, 186, 198, 0.15);
  background: rgba(255, 255, 255, 0.035);
}

.prj-skill-logo-tile img {
  display: block;
  width: 100%;
  height: 100%;
  object-fit: contain;
}
```

Move soft skills down slightly:

```css
.prj-skills-row {
  gap: 24px;
}

.prj-skills-group + .prj-skills-group {
  margin-top: 10px;
}
```

Update responsive widths so tablet still fits:

```css
@media (max-width: 900px) {
  .prj-row { grid-template-columns: 48px 220px 1fr; }
  .prj-row-body { padding-left: 28px; }
}
```

- [ ] **Step 4: Run focused data tests**

Run: `npm.cmd test -- src/data/projects.test.ts`

Expected: PASS.

---

### Task 4: Verification and Commit

**Files:**
- Inspect: browser page at `http://127.0.0.1:5176`

- [ ] **Step 1: Run full tests**

Run: `npm.cmd test`

Expected: PASS.

- [ ] **Step 2: Run production build**

Run: `npm.cmd run build`

Expected: PASS.

- [ ] **Step 3: Verify the running site**

Run a browser/Playwright check that confirms:

```txt
the projects page loads
9 project titles render
at least 20 logo images render under .prj-skill-logo-strip
project thumbnails render as .prj-row-img with object-fit: cover
the first desktop row uses a 310px image column
```

- [ ] **Step 4: Commit implementation**

Stage only intended files:

```bash
git add src/data/projects.ts src/data/projects.test.ts src/components/projects/projects-page.tsx src/app/globals.css public/skill-logos
git commit -m "feat: refine project card media and skill logos"
```
