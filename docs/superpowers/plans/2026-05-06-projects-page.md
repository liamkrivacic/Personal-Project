# Projects Page Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace the old scroll-pinned project-journey component with a standalone `/projects` route that the black-hole hero navigates to after the full dive, showing a filtered, animated list of projects.

**Architecture:** The hero's post-dive callback changes from a same-page scroll to `router.push('/projects')`. The new route is a Next.js App Router page whose client component runs a Drift+Blur entrance animation on mount and uses IntersectionObserver for scroll-triggered re-animation on rows. Filter state lives in React `useState`; the DOM-level `display`/`classList` toggles are applied imperatively (matching the proven mockup logic) rather than through re-renders.

**Tech Stack:** Next.js 16 App Router, React 19, TypeScript strict, existing globals.css CSS variables, inline SVG symbols for project thumbnails.

**Reference:** The approved visual design lives at `public/mockups/projects-design.html`. All layout, animation behaviour, filter logic, and bug fixes from the final version of that file are the source of truth.

**Contact info (bake into component, do not read from env):**
- Email: `liam.krivacic@gmail.com`
- LinkedIn: `https://www.linkedin.com/in/liam-krivacic-475157358/`

---

## Files

| Action | Path | Purpose |
|--------|------|---------|
| Delete | `src/components/projects/project-journey.tsx` | Old component, replaced entirely |
| Create | `src/data/projects.ts` | Project data array + types |
| Create | `src/components/projects/projects-page.tsx` | `"use client"` full page component |
| Create | `src/app/projects/page.tsx` | Next.js route — renders `<ProjectsPage />` |
| Modify | `src/app/globals.css` | Add all `.prj-*` CSS + `.prj-will-animate` animation classes |
| Modify | `src/components/orbital/orbital-hero-tsbxw3.tsx` | Replace scroll-to-section with `router.push('/projects')` |

---

## Task 1: Delete old component

**Files:**
- Delete: `src/components/projects/project-journey.tsx`

- [ ] **Step 1: Verify no imports**

Run: `grep -r "project-journey" src/ --include="*.tsx" --include="*.ts"`

Expected: no output. (The component was already removed from `src/app/page.tsx` in checkpoint 15.)

- [ ] **Step 2: Delete the file**

```bash
rm "src/components/projects/project-journey.tsx"
```

- [ ] **Step 3: Commit**

```bash
git add -A
git commit -m "chore: remove old project-journey component"
```

---

## Task 2: Create project data file

**Files:**
- Create: `src/data/projects.ts`

- [ ] **Step 1: Create the file**

`src/data/projects.ts`:
```ts
export type ProjectType = "rf" | "robotics" | "software" | "hardware";
export type ProjectCtx = "uni" | "work" | "hobby";

export type Project = {
  id: string;
  num: string;
  type: ProjectType;
  ctx: ProjectCtx;
  cat: string;
  catLabel: string;
  ctxLabel: string;
  title: string;
  signal: string;
  hard: string[];
  soft: string[];
  img: string;
};

export const projects: Project[] = [
  {
    id: "rf-plasma",
    num: "01",
    type: "rf",
    ctx: "uni",
    cat: "rf",
    catLabel: "RF / Plasma",
    ctxLabel: "University",
    title: "RF Plasma",
    signal:
      "Bench energy made observable. A hardware-first investigation into controlled RF energy, measurement loops, and the boundary between simulation and physical behaviour.",
    hard: ["RF systems", "Instrumentation", "Signal analysis"],
    soft: ["Technical writing", "Problem decomposition", "Research rigour"],
    img: "img-rf",
  },
  {
    id: "sumobot",
    num: "02",
    type: "robotics",
    ctx: "uni",
    cat: "robotics",
    catLabel: "Robotics",
    ctxLabel: "University",
    title: "Sumobot",
    signal:
      "Small robot, hard real-time instincts. Built around fast sensing, decisive control logic, and physical design that survives contact with the arena.",
    hard: ["Embedded C", "Motor control", "PCB design"],
    soft: ["Iterative design", "Systems thinking", "Rapid prototyping"],
    img: "img-sumo",
  },
  {
    id: "fmcg-web",
    num: "03",
    type: "software",
    ctx: "work",
    cat: "software",
    catLabel: "Software",
    ctxLabel: "Work",
    title: "FMCG Web",
    signal:
      "Operational data without the spreadsheet gravity well. A web workflow shaped around interruption and speed — readable when people are moving quickly.",
    hard: ["Next.js", "TypeScript", "UI / UX"],
    soft: ["Client comms", "Requirement gathering", "Product thinking"],
    img: "img-fmcg",
  },
  {
    id: "lab-demo",
    num: "04",
    type: "hardware",
    ctx: "uni",
    cat: "hardware",
    catLabel: "Hardware",
    ctxLabel: "University",
    title: "Lab Demo",
    signal:
      "Reliable demos for fragile physical systems. Infrastructure shaped around repeatability: wiring, setup, docs, and recovery paths.",
    hard: ["Electronics", "Schematic design", "Test flow"],
    soft: ["Teaching", "Knowledge transfer", "Process design"],
    img: "img-lab",
  },
];
```

- [ ] **Step 2: Commit**

```bash
git add src/data/projects.ts
git commit -m "feat: add projects data file"
```

---

## Task 3: Add projects-page CSS to globals.css

**Files:**
- Modify: `src/app/globals.css` (append after the last existing rule)

All new classes are prefixed `.prj-` to avoid collisions with existing `.project-*` classes.

- [ ] **Step 1: Append the CSS block**

Add the following at the very end of `src/app/globals.css`:

```css
/* ─────────────────────────────────────────────────────────
   /projects page — prefixed .prj-* to avoid collision with
   existing .project-* classes from the old journey component
   ───────────────────────────────────────────────────────── */

/* ── Animation: Drift + Blur ── */
.prj-will-animate {
  opacity: 0;
  filter: blur(8px);
  transform: translateY(20px);
  transition:
    opacity 0.9s ease,
    filter 0.9s ease,
    transform 0.9s cubic-bezier(0.16, 1, 0.3, 1);
}
.prj-will-animate.in {
  opacity: 1;
  filter: blur(0px);
  transform: translateY(0);
}

/* ── Page wrapper ── */
.prj-page {
  background: var(--bg);
  color: var(--text);
  font-family: var(--body-font);
  min-height: 100vh;
}

/* ── Centred column ── */
.prj-col {
  max-width: 1040px;
  margin: 0 auto;
  padding: 0 48px;
}

/* ── Page heading ── */
.prj-head {
  padding: 80px 0 48px;
  border-bottom: 1px solid rgba(255, 243, 213, 0.10);
  display: flex;
  align-items: flex-end;
  justify-content: space-between;
  gap: 48px;
}
.prj-head-left {
  flex: 1;
  min-width: 0;
  overflow: hidden;
}
.prj-head-eye {
  font-family: var(--mono-font);
  font-size: 10px;
  letter-spacing: 0.18em;
  text-transform: uppercase;
  color: var(--dim);
  margin: 0 0 20px;
}
.prj-head-title {
  font-family: var(--display-font);
  font-size: clamp(52px, 7vw, 96px);
  font-weight: 300;
  letter-spacing: -0.04em;
  line-height: 0.9;
  color: var(--text);
  margin: 0;
  overflow: hidden;
}
.prj-title-word {
  display: inline-block;
}

/* ── Contact block ── */
.prj-contact-block {
  flex-shrink: 0;
  display: flex;
  flex-direction: column;
  gap: 10px;
  padding-bottom: 8px;
  padding-left: 36px;
  border-left: 1px solid rgba(162, 186, 198, 0.17);
}
.prj-contact-label {
  font-family: var(--mono-font);
  font-size: 9px;
  letter-spacing: 0.18em;
  text-transform: uppercase;
  color: var(--dim);
  margin: 0 0 4px;
}
.prj-contact-link {
  display: flex;
  align-items: center;
  gap: 10px;
  font-family: var(--mono-font);
  font-size: 11px;
  letter-spacing: 0.04em;
  color: var(--muted);
  text-decoration: none;
  transition: color 0.15s;
}
.prj-contact-link:hover { color: var(--accent); }
.prj-contact-icon {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 20px;
  height: 20px;
  border: 1px solid rgba(162, 186, 198, 0.17);
  border-radius: 2px;
  font-size: 10px;
  font-style: normal;
  color: var(--dim);
  flex-shrink: 0;
  font-family: var(--mono-font);
  transition: border-color 0.15s, color 0.15s;
}
.prj-contact-link:hover .prj-contact-icon {
  border-color: var(--accent);
  color: var(--accent);
}

/* ── Filter bar ── */
.prj-filter-bar {
  padding: 20px 0;
  border-bottom: 1px solid rgba(255, 243, 213, 0.10);
  display: flex;
  align-items: center;
  gap: 24px;
  flex-wrap: wrap;
}
.prj-filter-group {
  display: flex;
  align-items: center;
  gap: 6px;
}
.prj-filter-label {
  font-family: var(--mono-font);
  font-size: 9px;
  letter-spacing: 0.18em;
  text-transform: uppercase;
  color: var(--dim);
  margin-right: 4px;
}
.prj-filter-pill {
  font-family: var(--mono-font);
  font-size: 10px;
  letter-spacing: 0.08em;
  text-transform: uppercase;
  padding: 5px 13px;
  border: 1px solid rgba(162, 186, 198, 0.17);
  color: var(--dim);
  cursor: pointer;
  background: none;
  transition: all 0.15s;
}
.prj-filter-pill:hover {
  border-color: var(--text);
  color: var(--text);
}
.prj-filter-pill.active {
  background: var(--accent);
  border-color: var(--accent);
  color: #030405;
  font-weight: 700;
}
.prj-filter-divider {
  width: 1px;
  height: 18px;
  background: rgba(162, 186, 198, 0.17);
}

/* ── List + rows ── */
.prj-list {
  display: flex;
  flex-direction: column;
}
.prj-row-wrap {
  max-width: 1040px;
  margin: 0 auto;
  padding: 0 48px;
  width: 100%;
}
.prj-row {
  position: relative;
  display: grid;
  grid-template-columns: 64px 240px 1fr;
  align-items: stretch;
  border-bottom: 1px solid rgba(255, 243, 213, 0.10);
  cursor: pointer;
  overflow: hidden;
  transition: background 0.25s;
  min-height: 200px;
}
.prj-row::before {
  content: "";
  position: absolute;
  left: 0;
  top: 0;
  bottom: 0;
  width: 3px;
  background: var(--accent);
  transform: scaleY(0);
  transform-origin: bottom;
  transition: transform 0.3s cubic-bezier(0.16, 1, 0.3, 1);
}
.prj-row:hover::before { transform: scaleY(1); }
.prj-row:hover { background: rgba(255, 209, 102, 0.025); }
.prj-row:hover .prj-row-num { color: var(--accent); }
.prj-row:hover .prj-row-cta { color: var(--accent); opacity: 1; }
.prj-row:hover .prj-row-cta-arrow { transform: translateX(4px); }

.prj-row-num {
  font-family: var(--display-font);
  font-size: 44px;
  font-weight: 300;
  letter-spacing: -0.04em;
  color: rgba(137, 151, 160, 0.20);
  display: flex;
  align-items: flex-start;
  padding: 28px 0;
  transition: color 0.25s;
  line-height: 1;
  border-right: 1px solid rgba(255, 243, 213, 0.10);
}
.prj-row-img-col {
  border-right: 1px solid rgba(255, 243, 213, 0.10);
  overflow: hidden;
}
.prj-row-img-col svg {
  width: 100%;
  height: 100%;
  display: block;
}
.prj-row-body {
  padding: 28px 0 28px 32px;
  display: flex;
  flex-direction: column;
  justify-content: space-between;
}
.prj-row-top-badges {
  display: flex;
  align-items: center;
  gap: 6px;
  margin-bottom: 10px;
  flex-wrap: wrap;
}
.prj-row-title {
  font-family: var(--display-font);
  font-size: clamp(18px, 1.8vw, 26px);
  font-weight: 400;
  letter-spacing: -0.02em;
  color: var(--text);
  margin: 0 0 10px;
  line-height: 1.05;
}
.prj-row-signal {
  font-size: 13px;
  color: var(--muted);
  line-height: 1.55;
  max-width: 48ch;
  margin: 0;
}
.prj-row-bottom {
  display: flex;
  align-items: flex-end;
  justify-content: space-between;
  margin-top: 16px;
}
.prj-row-cta {
  font-family: var(--mono-font);
  font-size: 10px;
  letter-spacing: 0.12em;
  text-transform: uppercase;
  color: var(--dim);
  opacity: 0.45;
  transition: all 0.2s;
  display: flex;
  align-items: center;
  gap: 6px;
}
.prj-row-cta-arrow {
  display: inline-block;
  transition: transform 0.2s;
}

/* ── Badges ── */
.prj-cat-badge {
  display: inline-block;
  font-family: var(--mono-font);
  font-size: 9px;
  letter-spacing: 0.10em;
  text-transform: uppercase;
  padding: 3px 9px;
  border-radius: 2px;
}
.prj-cat-badge.software {
  background: rgba(100, 180, 255, 0.10);
  color: #7ec8f7;
  border: 1px solid rgba(100, 180, 255, 0.18);
}
.prj-cat-badge.hardware {
  background: rgba(255, 180, 80, 0.10);
  color: #f7c46a;
  border: 1px solid rgba(255, 180, 80, 0.18);
}
.prj-cat-badge.robotics {
  background: rgba(140, 255, 160, 0.10);
  color: #88e89a;
  border: 1px solid rgba(140, 255, 160, 0.18);
}
.prj-cat-badge.rf {
  background: rgba(200, 140, 255, 0.10);
  color: #c89cf7;
  border: 1px solid rgba(200, 140, 255, 0.18);
}
.prj-ctx-badge {
  display: inline-block;
  font-family: var(--mono-font);
  font-size: 9px;
  letter-spacing: 0.10em;
  text-transform: uppercase;
  padding: 3px 9px;
  border-radius: 2px;
  background: rgba(137, 151, 160, 0.10);
  color: var(--dim);
  border: 1px solid rgba(162, 186, 198, 0.17);
}

/* ── Skills ── */
.prj-skills-block { margin-top: 16px; }
.prj-skills-row { display: flex; gap: 20px; flex-wrap: wrap; }
.prj-skills-group { display: flex; flex-direction: column; gap: 4px; }
.prj-skills-group-label {
  font-family: var(--mono-font);
  font-size: 8px;
  letter-spacing: 0.16em;
  text-transform: uppercase;
  color: var(--dim);
  opacity: 0.65;
}
.prj-skills-pills { display: flex; flex-wrap: wrap; gap: 4px; }
.prj-skill-pill {
  font-family: var(--mono-font);
  font-size: 9px;
  letter-spacing: 0.08em;
  text-transform: uppercase;
  padding: 2px 8px;
  border: 1px solid rgba(162, 186, 198, 0.17);
  color: var(--dim);
}
.prj-skill-pill.soft {
  border-color: rgba(255, 243, 213, 0.08);
  color: rgba(200, 197, 182, 0.6);
  font-style: italic;
  letter-spacing: 0.03em;
  text-transform: none;
}

/* ── Responsive ── */
@media (max-width: 900px) {
  .prj-col { padding: 0 24px; }
  .prj-row-wrap { padding: 0 24px; }
  .prj-head { flex-direction: column; align-items: flex-start; gap: 28px; }
  .prj-contact-block { border-left: 0; padding-left: 0; border-top: 1px solid rgba(162, 186, 198, 0.17); padding-top: 20px; }
  .prj-row { grid-template-columns: 48px 180px 1fr; }
}

@media (max-width: 640px) {
  .prj-col { padding: 0 16px; }
  .prj-row-wrap { padding: 0 16px; }
  .prj-head { padding: 48px 0 32px; }
  .prj-row { grid-template-columns: 1fr; min-height: auto; }
  .prj-row-num { display: none; }
  .prj-row-img-col { border-right: 0; border-bottom: 1px solid rgba(255, 243, 213, 0.10); height: 140px; }
  .prj-row-body { padding: 16px 0; }
}
```

- [ ] **Step 2: Verify build passes (CSS syntax check)**

```bash
npm run build 2>&1 | head -30
```

Expected: no CSS errors.

- [ ] **Step 3: Commit**

```bash
git add src/app/globals.css
git commit -m "feat: add prj-* CSS for projects list page"
```

---

## Task 4: Create ProjectsPage client component

**Files:**
- Create: `src/components/projects/projects-page.tsx`

This is the main client component. It:
1. Disables `scroll-snap-type` on `<html>` for the duration of the page (the home page uses it; projects doesn't)
2. Runs the stagger entrance animation once on mount
3. Sets up IntersectionObserver for scroll-triggered row re-animation (scroll-down only)
4. Manages filter state

- [ ] **Step 1: Create the file**

`src/components/projects/projects-page.tsx`:
```tsx
"use client";

import { useEffect, useRef, useState, type CSSProperties } from "react";
import { projects } from "@/data/projects";

export function ProjectsPage() {
  const eyeRef = useRef<HTMLParagraphElement>(null);
  const titleRef = useRef<HTMLHeadingElement>(null);
  const contactRef = useRef<HTMLDivElement>(null);
  const filterRef = useRef<HTMLDivElement>(null);
  const listRef = useRef<HTMLDivElement>(null);
  const ioRef = useRef<IntersectionObserver | null>(null);

  const [activeFilters, setActiveFilters] = useState<{ type: string; ctx: string }>({
    type: "all",
    ctx: "all",
  });

  // Disable html scroll-snap while on the projects page (home page uses it).
  useEffect(() => {
    const prev = document.documentElement.style.scrollSnapType;
    document.documentElement.style.scrollSnapType = "none";
    return () => {
      document.documentElement.style.scrollSnapType = prev;
    };
  }, []);

  // Entrance animation — runs once on mount.
  useEffect(() => {
    const eyeEl = eyeRef.current;
    const titleEl = titleRef.current;
    const contactEl = contactRef.current;
    const filterEl = filterRef.current;
    const listEl = listRef.current;

    if (!eyeEl || !titleEl || !contactEl || !filterEl || !listEl) return;

    const words = Array.from(titleEl.querySelectorAll<HTMLElement>(".prj-title-word"));
    const rows = Array.from(listEl.querySelectorAll<HTMLElement>(".prj-row-wrap"));
    const allEls: HTMLElement[] = [eyeEl, ...words, contactEl, filterEl, ...rows];

    // Reset everything to hidden state.
    allEls.forEach((el) => {
      el.classList.remove("in");
      el.classList.add("prj-will-animate");
    });

    // Force reflow so the hidden state is registered before transitions can fire.
    void document.body.offsetHeight;

    // Staggered reveals.
    setTimeout(() => eyeEl.classList.add("in"), 280);
    words.forEach((w, i) => setTimeout(() => w.classList.add("in"), 400 + i * 100));
    setTimeout(() => contactEl.classList.add("in"), 520);
    setTimeout(() => filterEl.classList.add("in"), 640);

    // Rows: on-screen rows get staggered timeouts; off-screen rows go straight to the IO.
    const onScreen = rows.filter((r) => r.getBoundingClientRect().top < window.innerHeight + 40);
    const offScreen = rows.filter((r) => r.getBoundingClientRect().top >= window.innerHeight + 40);

    const io = new IntersectionObserver(
      (entries) => {
        entries.forEach((e) => {
          if (e.isIntersecting) {
            e.target.classList.add("in");
          } else {
            // Only reset if element is below the viewport — keep visible when scrolled off top.
            if (e.boundingClientRect.top > 0) {
              e.target.classList.remove("in");
            }
          }
        });
      },
      { threshold: 0.06, rootMargin: "0px 0px -32px 0px" },
    );

    ioRef.current = io;
    offScreen.forEach((el) => io.observe(el));

    onScreen.forEach((row, i) => {
      setTimeout(() => {
        row.classList.add("in");
        io.observe(row);
      }, 760 + i * 130);
    });

    return () => io.disconnect();
  }, []);

  function handleFilter(dim: "type" | "ctx", val: string) {
    const next = { ...activeFilters, [dim]: val };
    setActiveFilters(next);

    if (!listRef.current) return;
    const rows = Array.from(listRef.current.querySelectorAll<HTMLElement>(".prj-row-wrap"));

    rows.forEach((wrap, i) => {
      const typeOk = next.type === "all" || wrap.dataset.type === next.type;
      const ctxOk = next.ctx === "all" || wrap.dataset.ctx === next.ctx;
      if (typeOk && ctxOk) {
        wrap.style.display = "";
        wrap.classList.remove("in");
        void wrap.offsetHeight;
        setTimeout(() => wrap.classList.add("in"), i * 80);
      } else {
        wrap.style.display = "none";
        wrap.classList.remove("in");
      }
    });
  }

  return (
    <div className="prj-page">
      {/* SVG symbol definitions — referenced by project rows */}
      <svg style={{ display: "none" }}>
        <symbol id="img-rf" viewBox="0 0 280 148" preserveAspectRatio="xMidYMid slice">
          <rect width="280" height="148" fill="#060809" />
          <line x1="0" y1="37" x2="280" y2="37" stroke="#8997a018" strokeWidth="0.5" />
          <line x1="0" y1="74" x2="280" y2="74" stroke="#8997a025" strokeWidth="0.5" />
          <line x1="0" y1="111" x2="280" y2="111" stroke="#8997a018" strokeWidth="0.5" />
          <line x1="56" y1="0" x2="56" y2="148" stroke="#8997a018" strokeWidth="0.5" />
          <line x1="112" y1="0" x2="112" y2="148" stroke="#8997a018" strokeWidth="0.5" />
          <line x1="168" y1="0" x2="168" y2="148" stroke="#8997a018" strokeWidth="0.5" />
          <line x1="224" y1="0" x2="224" y2="148" stroke="#8997a018" strokeWidth="0.5" />
          <path d="M0 74 C7 74 7 36 14 36 C21 36 21 112 28 112 C35 112 35 36 42 36 C49 36 49 112 56 112 C63 112 63 36 70 36 C77 36 77 112 84 112 C91 112 91 36 98 36 C105 36 105 112 112 112 C119 112 119 36 126 36 C133 36 133 112 140 112 C147 112 147 36 154 36 C161 36 161 112 168 112 C175 112 175 36 182 36 C189 36 189 112 196 112 C203 112 203 36 210 36 C217 36 217 112 224 112 C231 112 231 36 238 36 C245 36 245 112 252 112 C259 112 259 36 266 36 C273 36 273 112 280 112" stroke="#c89cf7" strokeWidth="1.5" opacity="0.55" />
          <path d="M0 74 C7 74 7 36 14 36 C21 36 21 112 28 112 C35 112 35 36 42 36 C49 36 49 112 56 112 C63 112 63 36 70 36 C77 36 77 112 84 112 C91 112 91 36 98 36 C105 36 105 112 112 112 C119 112 119 36 126 36 C133 36 133 112 140 112 C147 112 147 36 154 36 C161 36 161 112 168 112 C175 112 175 36 182 36 C189 36 189 112 196 112 C203 112 203 36 210 36 C217 36 217 112 224 112 C231 112 231 36 238 36 C245 36 245 112 252 112 C259 112 259 36 266 36 C273 36 273 112 280 112" stroke="#c89cf7" strokeWidth="8" opacity="0.06" />
          <line x1="140" y1="0" x2="140" y2="148" stroke="#ffd16640" strokeWidth="1" strokeDasharray="3 3" />
          <circle cx="140" cy="36" r="3" fill="#ffd166" opacity="0.7" />
          <text x="8" y="144" fill="#8997a0" fontSize="8" fontFamily="monospace" opacity="0.5">50–500 MHz</text>
        </symbol>
        <symbol id="img-sumo" viewBox="0 0 280 148" preserveAspectRatio="xMidYMid slice">
          <rect width="280" height="148" fill="#050706" />
          <rect x="76" y="24" width="128" height="100" rx="6" stroke="#88e89a" strokeWidth="1.5" fill="#88e89a07" />
          <rect x="58" y="32" width="20" height="34" rx="3" stroke="#88e89a70" strokeWidth="1.2" fill="#88e89a08" />
          <rect x="58" y="82" width="20" height="34" rx="3" stroke="#88e89a70" strokeWidth="1.2" fill="#88e89a08" />
          <rect x="202" y="32" width="20" height="34" rx="3" stroke="#88e89a70" strokeWidth="1.2" fill="#88e89a08" />
          <rect x="202" y="82" width="20" height="34" rx="3" stroke="#88e89a70" strokeWidth="1.2" fill="#88e89a08" />
          <rect x="88" y="24" width="104" height="8" fill="#88e89a12" stroke="#88e89a50" strokeWidth="1" />
          <circle cx="108" cy="28" r="3" stroke="#ffd166" strokeWidth="1" fill="none" />
          <circle cx="128" cy="28" r="3" stroke="#ffd166" strokeWidth="1" fill="none" />
          <circle cx="148" cy="28" r="3" stroke="#ffd166" strokeWidth="1" fill="none" />
          <circle cx="168" cy="28" r="3" stroke="#ffd166" strokeWidth="1" fill="none" />
          <rect x="100" y="44" width="80" height="56" rx="2" stroke="#88e89a35" strokeWidth="1" fill="#88e89a05" />
          <text x="112" y="72" fill="#7ec8f7" fontSize="7" fontFamily="monospace" opacity="0.65">MCU</text>
          <text x="151" y="72" fill="#ffd166" fontSize="7" fontFamily="monospace" opacity="0.65">PWR</text>
          <line x1="58" y1="12" x2="222" y2="12" stroke="#8997a035" strokeWidth="0.8" />
          <line x1="58" y1="9" x2="58" y2="15" stroke="#8997a035" strokeWidth="0.8" />
          <line x1="222" y1="9" x2="222" y2="15" stroke="#8997a035" strokeWidth="0.8" />
          <text x="124" y="10" fill="#8997a0" fontSize="7" fontFamily="monospace" opacity="0.55" textAnchor="middle">160 mm</text>
          <text x="8" y="143" fill="#8997a0" fontSize="7" fontFamily="monospace" opacity="0.45">TOP VIEW — 1:1</text>
        </symbol>
        <symbol id="img-fmcg" viewBox="0 0 280 148" preserveAspectRatio="xMidYMid slice">
          <rect width="280" height="148" fill="#04060a" />
          <rect width="280" height="22" fill="#0a0d12" />
          <circle cx="12" cy="11" r="3.5" fill="#ff605c28" />
          <circle cx="24" cy="11" r="3.5" fill="#ffbd4428" />
          <circle cx="36" cy="11" r="3.5" fill="#28ca4128" />
          <text x="54" y="15" fill="#8997a060" fontSize="8" fontFamily="monospace">Operations</text>
          <rect x="0" y="22" width="44" height="126" fill="#06080c" />
          <rect x="8" y="34" width="28" height="4" rx="1" fill="#8997a025" />
          <rect x="8" y="44" width="28" height="4" rx="1" fill="#7ec8f718" />
          <line x1="44" y1="22" x2="44" y2="148" stroke="#8997a012" />
          <rect x="52" y="28" width="52" height="28" rx="2" fill="#0c1018" stroke="#8997a012" strokeWidth="0.8" />
          <text x="58" y="39" fill="#8997a0" fontSize="6" fontFamily="monospace">ORDERS</text>
          <text x="58" y="50" fill="#fff3d5" fontSize="11" fontFamily="monospace" fontWeight="bold">2,418</text>
          <rect x="110" y="28" width="52" height="28" rx="2" fill="#0c1018" stroke="#8997a012" strokeWidth="0.8" />
          <text x="116" y="39" fill="#8997a0" fontSize="6" fontFamily="monospace">PENDING</text>
          <text x="116" y="50" fill="#ffd166" fontSize="11" fontFamily="monospace" fontWeight="bold">47</text>
          <rect x="168" y="28" width="52" height="28" rx="2" fill="#0c1018" stroke="#8997a012" strokeWidth="0.8" />
          <text x="174" y="39" fill="#8997a0" fontSize="6" fontFamily="monospace">ISSUES</text>
          <text x="174" y="50" fill="#f77e7e" fontSize="11" fontFamily="monospace" fontWeight="bold">3</text>
          <rect x="226" y="28" width="46" height="28" rx="2" fill="#0c1018" stroke="#8997a012" strokeWidth="0.8" />
          <text x="232" y="39" fill="#8997a0" fontSize="6" fontFamily="monospace">ON TIME</text>
          <text x="232" y="50" fill="#88e89a" fontSize="11" fontFamily="monospace" fontWeight="bold">94%</text>
          <rect x="52" y="64" width="140" height="76" rx="2" fill="#0a0d12" stroke="#8997a012" strokeWidth="0.8" />
          <text x="58" y="75" fill="#8997a055" fontSize="6" fontFamily="monospace">THROUGHPUT</text>
          <rect x="62" y="110" width="12" height="22" rx="1" fill="#7ec8f728" />
          <rect x="80" y="100" width="12" height="32" rx="1" fill="#7ec8f738" />
          <rect x="98" y="88" width="12" height="44" rx="1" fill="#7ec8f748" />
          <rect x="116" y="94" width="12" height="38" rx="1" fill="#7ec8f738" />
          <rect x="134" y="82" width="12" height="50" rx="1" fill="#7ec8f758" />
          <rect x="152" y="90" width="12" height="42" rx="1" fill="#ffd16660" />
          <rect x="170" y="78" width="12" height="54" rx="1" fill="#7ec8f768" />
          <rect x="198" y="64" width="74" height="76" rx="2" fill="#0a0d12" stroke="#8997a012" strokeWidth="0.8" />
          <text x="204" y="75" fill="#8997a055" fontSize="6" fontFamily="monospace">EXCEPTIONS</text>
          <rect x="204" y="84" width="40" height="3" rx="1" fill="#c8c5b618" />
          <rect x="248" y="84" width="16" height="3" rx="1" fill="#f77e7e28" />
          <rect x="204" y="93" width="36" height="3" rx="1" fill="#c8c5b618" />
          <rect x="248" y="93" width="16" height="3" rx="1" fill="#ffd16638" />
          <rect x="204" y="102" width="44" height="3" rx="1" fill="#c8c5b618" />
          <rect x="248" y="102" width="16" height="3" rx="1" fill="#88e89a28" />
        </symbol>
        <symbol id="img-lab" viewBox="0 0 280 148" preserveAspectRatio="xMidYMid slice">
          <rect width="280" height="148" fill="#060708" />
          <line x1="20" y1="24" x2="260" y2="24" stroke="#f77e7e55" strokeWidth="1.5" />
          <text x="8" y="27" fill="#f77e7e" fontSize="7" fontFamily="monospace" opacity="0.6">+V</text>
          <line x1="20" y1="124" x2="260" y2="124" stroke="#7ec8f755" strokeWidth="1.5" />
          <text x="8" y="127" fill="#7ec8f7" fontSize="7" fontFamily="monospace" opacity="0.6">GND</text>
          <rect x="40" y="48" width="48" height="52" rx="2" stroke="#ffd16670" strokeWidth="1.2" fill="#ffd16606" />
          <text x="49" y="74" fill="#ffd166" fontSize="8" fontFamily="monospace" opacity="0.75">MCU</text>
          <rect x="122" y="52" width="36" height="28" rx="2" stroke="#88e89a70" strokeWidth="1.2" fill="#88e89a06" />
          <text x="127" y="70" fill="#88e89a" fontSize="8" fontFamily="monospace" opacity="0.75">SENS</text>
          <rect x="192" y="48" width="40" height="36" rx="2" stroke="#c89cf770" strokeWidth="1.2" fill="#c89cf706" />
          <text x="197" y="70" fill="#c89cf7" fontSize="8" fontFamily="monospace" opacity="0.75">RLY</text>
          <rect x="192" y="96" width="40" height="20" rx="2" stroke="#8997a055" strokeWidth="1" fill="#8997a006" />
          <text x="198" y="109" fill="#8997a0" fontSize="8" fontFamily="monospace" opacity="0.65">LOAD</text>
          <line x1="88" y1="64" x2="122" y2="66" stroke="#fff3d535" />
          <line x1="88" y1="74" x2="122" y2="74" stroke="#fff3d535" />
          <line x1="158" y1="66" x2="192" y2="60" stroke="#fff3d535" />
          <line x1="212" y1="84" x2="212" y2="96" stroke="#fff3d535" />
          <line x1="64" y1="24" x2="64" y2="48" stroke="#f77e7e35" />
          <line x1="212" y1="24" x2="212" y2="48" stroke="#f77e7e35" />
          <line x1="64" y1="100" x2="64" y2="124" stroke="#7ec8f735" />
          <line x1="212" y1="116" x2="212" y2="124" stroke="#7ec8f735" />
          <circle cx="64" cy="48" r="2.5" fill="#f77e7e70" />
          <circle cx="212" cy="48" r="2.5" fill="#f77e7e70" />
          <circle cx="64" cy="100" r="2.5" fill="#7ec8f770" />
          <text x="8" y="143" fill="#8997a0" fontSize="7" fontFamily="monospace" opacity="0.45">SCHEMATIC REV 2</text>
        </symbol>
      </svg>

      {/* Page header */}
      <div className="prj-col">
        <div className="prj-head">
          <div className="prj-head-left">
            <p className="prj-head-eye prj-will-animate" ref={eyeRef}>
              Selected work
            </p>
            <h1 className="prj-head-title" ref={titleRef}>
              {"My Projects".split(" ").map((word, i) => (
                <span
                  key={word}
                  className="prj-title-word prj-will-animate"
                  style={{ "--wi": i } as CSSProperties}
                >
                  {word}&nbsp;
                </span>
              ))}
            </h1>
          </div>
          <div className="prj-contact-block prj-will-animate" ref={contactRef}>
            <p className="prj-contact-label">Get in touch</p>
            <a className="prj-contact-link" href="mailto:liam.krivacic@gmail.com">
              <span className="prj-contact-icon">✉</span>
              liam.krivacic@gmail.com
            </a>
            <a
              className="prj-contact-link"
              href="https://www.linkedin.com/in/liam-krivacic-475157358/"
              target="_blank"
              rel="noopener noreferrer"
            >
              <span className="prj-contact-icon">in</span>
              linkedin.com/in/liam-krivacic
            </a>
          </div>
        </div>

        {/* Filter bar */}
        <div className="prj-filter-bar prj-will-animate" ref={filterRef}>
          <div className="prj-filter-group">
            <span className="prj-filter-label">Type</span>
            {(
              [
                { val: "all", label: "All" },
                { val: "software", label: "Software" },
                { val: "hardware", label: "Hardware" },
                { val: "robotics", label: "Robotics" },
                { val: "rf", label: "RF / Plasma" },
              ] as const
            ).map(({ val, label }) => (
              <button
                key={val}
                className={`prj-filter-pill${activeFilters.type === val ? " active" : ""}`}
                onClick={() => handleFilter("type", val)}
                type="button"
              >
                {label}
              </button>
            ))}
          </div>
          <div className="prj-filter-divider" />
          <div className="prj-filter-group">
            <span className="prj-filter-label">Context</span>
            {(
              [
                { val: "all", label: "All" },
                { val: "uni", label: "University" },
                { val: "work", label: "Work" },
                { val: "hobby", label: "Hobby" },
              ] as const
            ).map(({ val, label }) => (
              <button
                key={val}
                className={`prj-filter-pill${activeFilters.ctx === val ? " active" : ""}`}
                onClick={() => handleFilter("ctx", val)}
                type="button"
              >
                {label}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Project list */}
      <div className="prj-list" ref={listRef}>
        {projects.map((p) => (
          <div
            key={p.id}
            className="prj-row-wrap prj-will-animate"
            data-type={p.type}
            data-ctx={p.ctx}
          >
            <div className="prj-row">
              <span className="prj-row-num">{p.num}</span>
              <div className="prj-row-img-col">
                <svg
                  width="100%"
                  height="100%"
                  viewBox="0 0 280 148"
                  preserveAspectRatio="xMidYMid slice"
                >
                  <use href={`#${p.img}`} />
                </svg>
              </div>
              <div className="prj-row-body">
                <div>
                  <div className="prj-row-top-badges">
                    <span className={`prj-cat-badge ${p.cat}`}>{p.catLabel}</span>
                    <span className="prj-ctx-badge">{p.ctxLabel}</span>
                  </div>
                  <h2 className="prj-row-title">{p.title}</h2>
                  <p className="prj-row-signal">{p.signal}</p>
                  <div className="prj-skills-block">
                    <div className="prj-skills-row">
                      <div className="prj-skills-group">
                        <span className="prj-skills-group-label">Hard skills</span>
                        <div className="prj-skills-pills">
                          {p.hard.map((s) => (
                            <span key={s} className="prj-skill-pill hard">
                              {s}
                            </span>
                          ))}
                        </div>
                      </div>
                      <div className="prj-skills-group">
                        <span className="prj-skills-group-label">Soft skills</span>
                        <div className="prj-skills-pills">
                          {p.soft.map((s) => (
                            <span key={s} className="prj-skill-pill soft">
                              {s}
                            </span>
                          ))}
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
                <div className="prj-row-bottom">
                  <span />
                  <span className="prj-row-cta">
                    View case study <span className="prj-row-cta-arrow">→</span>
                  </span>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
```

- [ ] **Step 2: Run TypeScript check**

```bash
npx tsc --noEmit 2>&1 | head -40
```

Expected: no errors.

- [ ] **Step 3: Commit**

```bash
git add src/components/projects/projects-page.tsx
git commit -m "feat: add ProjectsPage client component with animation + filters"
```

---

## Task 5: Create /projects route

**Files:**
- Create: `src/app/projects/page.tsx`

- [ ] **Step 1: Create the route file**

`src/app/projects/page.tsx`:
```tsx
import type { Metadata } from "next";
import { ProjectsPage } from "@/components/projects/projects-page";

export const metadata: Metadata = {
  title: "Projects — Liam Krivacic",
  description:
    "RF plasma systems, robotics, software, and hardware projects by Liam Krivacic.",
};

export default function Projects() {
  return <ProjectsPage />;
}
```

- [ ] **Step 2: Run build**

```bash
npm run build 2>&1 | tail -20
```

Expected: build succeeds with `/projects` listed in the routes output.

- [ ] **Step 3: Commit**

```bash
git add src/app/projects/
git commit -m "feat: add /projects route"
```

---

## Task 6: Wire hero post-dive to navigate to /projects

**Files:**
- Modify: `src/components/orbital/orbital-hero-tsbxw3.tsx`

The hero currently calls `scrollToFirstProject()` after full dive, which tries to find `#projects` on the same page. We replace this with `router.push('/projects')`.

- [ ] **Step 1: Edit orbital-hero-tsbxw3.tsx**

Add `useRouter` import (line 4, after existing imports):
```tsx
import { useRouter } from "next/navigation";
```

Inside the `OrbitalHeroTsbxw3` function body, add after the existing refs (around line 33):
```tsx
const router = useRouter();
```

Replace the entire `scrollToFirstProject` function (lines 73–82):
```tsx
const scrollToFirstProject = () => {
  router.push("/projects");
};
```

The `releasePageScroll` call that happens just before `scrollToFirstProject()` in `handleMessage` and `handleWheel` is correct — it restores scroll state before navigation. Leave those call sites unchanged.

- [ ] **Step 2: Run TypeScript check**

```bash
npx tsc --noEmit 2>&1 | head -20
```

Expected: no errors.

- [ ] **Step 3: Verify the full flow manually**

Start the dev server:
```bash
npm run dev -- --hostname 127.0.0.1 --port 5176
```

Open `http://127.0.0.1:5176` and scroll / swipe fully into the black hole. At full dive (screen goes solid black) the page should navigate to `http://127.0.0.1:5176/projects` and the project list should fade in.

Check:
- [ ] Entrance animation runs (eyebrow → title words → contact → filter bar → rows)
- [ ] All 4 rows appear with correct SVG thumbnails
- [ ] Filter pills toggle active state and re-animate visible rows
- [ ] Scrolling down re-animates rows entering viewport; rows scrolled off the top stay visible
- [ ] Contact links are correct (email + LinkedIn)

- [ ] **Step 4: Commit**

```bash
git add src/components/orbital/orbital-hero-tsbxw3.tsx
git commit -m "feat: hero post-dive navigates to /projects route"
```

---

## Task 7: Clean up and final check

- [ ] **Step 1: Run full lint + build**

```bash
npm run lint && npm run build
```

Expected: zero lint errors, build succeeds.

- [ ] **Step 2: Run tests**

```bash
npm test
```

Expected: all tests pass (shader/string tests — nothing new to test here).

- [ ] **Step 3: Commit checkpoint**

```bash
git add -A
git commit -m "checkpoint 17: projects route live — hero dives to /projects, animated list + filters"
```
