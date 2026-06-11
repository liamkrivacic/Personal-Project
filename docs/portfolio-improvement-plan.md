# Portfolio Implementation Spec — liam-krivacic.vercel.app

Authoritative implementation spec for `liamkrivacic/Personal-Project` (Next.js 16.2.4, React 19, TypeScript, Tailwind 3.4, App Router, Vercel). All decisions are locked. Work proceeds through **9 checkpoints**. Each checkpoint is an independent, shippable unit.

## 🔖 Checkpoint protocol (instructions to the executing agent)

At the end of every checkpoint, you MUST:
1. Run the automated gate: `npm run lint && npm test && npm run build` (plus `npm run test:fluid` where the checkpoint says so). Fix failures before proceeding.
2. Start the dev server and tell the user it's ready for review.
3. Present the checkpoint's **Human verification** list to the user verbatim.
4. **STOP. Do not begin the next checkpoint.** Wait for the user to either approve or report issues. Fix reported issues, re-run the gate, and re-present.
5. On approval, commit with the suggested message and `git push`, then confirm the push succeeded before starting the next checkpoint.

One checkpoint = one commit (plus fixup commits if review finds issues). Never batch checkpoints into a single commit. If a later checkpoint reveals a defect in an earlier one, fix it as a separate small commit with a `fix:` prefix.

---

## ⚠️ READ FIRST — repo-specific hazards (apply to ALL checkpoints)

1. **Source-invariant tests will break on refactors.** `src/lib/project-card-layout-source.test.ts`, `src/lib/project-entry-timing-source.test.ts`, and `src/lib/black-hole-tsbxw3-shader.test.ts` read source files as raw text and assert exact strings (class names, listener registrations, CSS rules like `.prj-row { height: 275px }`). When a checkpoint changes asserted code, **update the test assertions to encode the new intended invariant — never delete a test, never weaken it to a trivial check.** Each checkpoint lists which assertions it touches.
2. **Do not modify** the shader math in `public/black-hole-tsbxw3/fluid.js`, the streamlet simulation in `public/black-hole-cursor-streamlets/fluid.js`, or the postMessage protocol types (`black-hole-dive`, `black-hole-cursor`, `black-hole-dive-input`, `black-hole-scroll-delta`, `black-hole-drag-delta`) — except the narrowly-scoped additive changes in Checkpoint 6.
3. **Do not change** logic in `src/lib/project-entry-timing.ts`, `src/lib/visual-scroll-smoothing.ts`, or `src/lib/project-row-reveal.ts`. The scroll feel is tuned and tested.
4. The `?v=tsbxw3-7` / `?v=old-cursor-12` query suffixes are manual cache busters. If you edit either fluid.js, bump its suffix in `src/components/scroll-journey.tsx`.
5. Skill-logo `<img>` tags (SVGs in pills) stay as plain `<img>` — never convert them to `next/image`.

---

# Checkpoint 1 — Web fonts

**Problem:** `globals.css` uses Bahnschrift / Aptos / Cascadia Mono — Windows-only system fonts. On macOS/Linux/Android the site degrades to generic sans-serif and loses its identity.

**Decision (locked):** `next/font/google`, self-hosted at build time — Display: **Archivo** weights `["600","700","800","900"]`; Body: **Inter** (variable); Mono: **JetBrains Mono** weights `["400","500"]`.

**Implementation** — `src/app/layout.tsx`:

```tsx
import { Archivo, Inter, JetBrains_Mono } from "next/font/google";

const archivo = Archivo({ subsets: ["latin"], weight: ["600", "700", "800", "900"], variable: "--font-display", display: "swap" });
const inter = Inter({ subsets: ["latin"], variable: "--font-body", display: "swap" });
const jetbrains = JetBrains_Mono({ subsets: ["latin"], weight: ["400", "500"], variable: "--font-mono", display: "swap" });

// on <html>: className={`${archivo.variable} ${inter.variable} ${jetbrains.variable}`}
```

In `globals.css`, repoint the existing vars (keep old fonts as fallbacks so nothing else changes):

```css
--display-font: var(--font-display), "Bahnschrift", "Arial Narrow", sans-serif;
--body-font: var(--font-body), "Segoe UI", sans-serif;
--mono-font: var(--font-mono), "Cascadia Mono", Consolas, monospace;
```

Archivo is slightly wider than Bahnschrift: add `letter-spacing: -0.015em` to `.hero-copy h1` and `.prj-head-title`. If "LIAM KRIVACIC" wraps awkwardly at desktop widths, reduce the h1 clamp max from `7.2rem` to `6.6rem` — change nothing else.

**Automated gate:** lint + test + build. No external font requests at runtime (next/font self-hosts).

**Human verification:**
- [ ] Hero name renders in Archivo (condensed-bold look retained), not a generic sans.
- [ ] Hero name fits on the intended lines at full desktop width and at ~390 px mobile width — no clipped glyphs from `line-height: 0.82`.
- [ ] Eyebrow, pills, and filter labels render in JetBrains Mono; paragraphs in Inter.
- [ ] Nothing else moved: compare hero + projects section against production side-by-side.

**Commit:** `feat: self-hosted web fonts (Archivo/Inter/JetBrains Mono), fix Windows-only font stack` — push.

---

# Checkpoint 2 — Image pipeline

**Scope: project thumbnails only** (`public/projects/*.png`, 930×825, ~4.8 MB total, rendered ≤ 280 px).

1. `next.config.ts`: add `images: { formats: ["image/avif", "image/webp"] }`.
2. In `projects-page.tsx`, replace the thumbnail `<img>`:

```tsx
import Image from "next/image";
// inside .prj-row-img-col:
<Image
  className="prj-row-img"
  src={p.img}
  alt={p.imgAlt}
  fill
  sizes="(max-width: 640px) 100vw, (max-width: 900px) 220px, 280px"
  style={{ objectFit: p.imageFit ?? "cover", objectPosition: p.imagePosition }}
/>
```

3. Add `position: relative;` to `.prj-row-img-col` (required by `fill`). Keep the existing `.prj-row-img { height: 100% }` CSS so layout-test CSS assertions still pass.
4. Add `imgAlt: string` to the `Project` type in `src/data/projects.ts`; write a descriptive alt for each of the 9 projects (e.g. `"HFSS simulation model of a WR340 cross-guide directional coupler"`). Remove `aria-hidden` from the thumbnail. Add to `src/data/projects.test.ts`: every project has `imgAlt` ≥ 20 chars.
5. Recompress: convert each PNG to WebP, max edge 1200 px, `cwebp -q 88` (or sharp equivalent). Update `img` paths in `projects.ts` to `.webp`, delete the PNGs. Target ≤ 150 KB per file, ≤ 900 KB total.
6. **Test updates** in `project-card-layout-source.test.ts`: thumbnail-markup assertions (`loading="lazy"`, `decoding="async"`, `alt=""` — whichever exist) become: imports `next/image`, uses `fill`, non-empty `sizes`, `alt={p.imgAlt}`. Skill-logo assertions (`className="prj-skill-logo"`, `src={skill.logo}`, `alt={skill.logoAlt}`) remain unchanged.

**Automated gate:** lint + test + build + `npm run test:fluid`.

**Human verification:**
- [ ] All 9 thumbnails render, correctly cropped (the per-project `imagePosition` values still apply — check SumoBot and Artwork cards especially).
- [ ] No layout shift or stretched/squashed images at desktop, 900 px, and 640 px widths.
- [ ] DevTools network tab on `next start`: card images served as AVIF/WebP, each well under 150 KB.
- [ ] Mobile (≤ 640 px): the 140 px image strip crops each project acceptably — if any crop badly, tune that project's `imagePosition` now.

**Commit:** `perf: next/image thumbnails + WebP sources (~4.8MB → <0.9MB)` — push.

---

# Checkpoint 3 — Case-study infrastructure + one proving page

Build the entire MDX system but seed **only one** case study (`rf-coupler-coax`) and link **only its row**. This proves the template before mass-producing content.

**Decisions (locked):** content in `content/projects/<slug>.mdx`; rendering via **`next-mdx-remote` (`/rsc` entry) + `gray-matter`** (`npm i next-mdx-remote gray-matter`); route `src/app/projects/[slug]/page.tsx`, statically generated. Slugs (locked, match thumbnail filenames): `rf-coupler-coax`, `stub-tuner-hfss`, `hv-magnetron-enclosure`, `sumobot-chassis`, `nas-infrastructure`, `wordpress-marketing`, `atomcraft-rf-leadership`, `personal-website-black-hole`, `artwork-collection`.

### 3.1 Data model
Add `slug: string` to every project in `src/data/projects.ts` (all 9, from the list above) and export `getProjectBySlug(slug)`.

Frontmatter schema — define type `CaseStudyFrontmatter` in `src/lib/case-studies.ts`, validate at read time, throw on missing required fields:

```yaml
---
slug: rf-coupler-coax        # required, must match a projects.ts slug
title: HFSS Directional Coupler and Coax Adapter   # required
summary: One-to-two sentence recruiter-facing summary.  # required
heroImage: /projects/rf-coupler-coax.webp           # required
date: 2025-09                                       # required, YYYY-MM
status: published            # required: "published" | "draft"
pdf: /case-studies/rf-coupler-coax.pdf              # optional
links:                                              # optional
  - label: GitHub
    url: https://github.com/...
---
```

`src/lib/case-studies.ts` exports: `getAllCaseStudies(): CaseStudyMeta[]` (fs + gray-matter, validated, sorted by project `num`) and `getCaseStudy(slug)`.

### 3.2 Page route
`src/app/projects/[slug]/page.tsx` (server component): `generateStaticParams` from `getAllCaseStudies()` (drafts build too, with `robots: { index: false }`); `generateMetadata` per slug (title `` `${title} | Liam Krivacic` ``, description = summary, OG image = heroImage); body via `<MDXRemote source={content} components={mdxComponents} />`; `notFound()` for unknown slugs.

**No black-hole iframe on case-study pages.** Static `var(--bg)` background with a subtle CSS gold glow: `radial-gradient(60% 40% at 70% 0%, rgba(255,209,102,0.06), transparent)`.

**PDF interim layout:** if `pdf` is set and the MDX body is < 200 characters, render hero + summary + a download button (reuse `.hero-link primary-link` styles) + `<object data={pdf} type="application/pdf">` with the button as fallback.

### 3.3 Layout shell + MDX components
New files in `src/components/case-study/`. Style via plain CSS classes appended to `globals.css` (the existing convention — do NOT introduce Tailwind utilities in JSX). Reuse theme tokens: `--bg`, `--text`, `--muted`, `--dim`, `--accent`, `--line`, `--line-cool`, the three font vars. Content column `max-width: 760px` centered; `wide` images up to 1100 px.

Components (exact props):
- `CaseHero({ frontmatter, project })` — back link ("← All projects" → `/#projects`); mono eyebrow = `project.catLabel`; `h1` display font, uppercase, weight 900, `clamp(2.6rem, 5vw, 4.2rem)`; summary in `--muted`; skill pills via a NEW shared `SkillPills({ hard, soft })` in `src/components/skill-pills.tsx` — **extract the pill markup from `projects-page.tsx` and use the shared component in both places** (update layout-source test strings if the extraction moves asserted markup out of `projects-page.tsx`: the assertions on `prj-skill-logo`, `src={skill.logo}`, `alt={skill.logoAlt}` should be re-pointed at `skill-pills.tsx`); hero image via `next/image` `width={1200} height={1065}` `priority`, 6 px radius, 1 px `--line` border.
- `Figure({ src, alt, caption?, wide?, width = 1200, height = 800 })` — `next/image`, caption mono/`--dim`/0.72rem.
- `FigureGrid({ children, cols = 2 })` — grid, `cols` → {2,3}, 1 column ≤ 640 px.
- `Callout({ title?, children })` — `border-left: 2px solid var(--accent)`, background `rgba(255,209,102,0.05)`, padding 16/20.
- `SpecTable({ rows })`, `rows: Array<[string, string]>` — key/value, hairline `--line` separators, mono keys in `--dim`.
- `NextProject({ currentSlug })` — prev/next across the locked slug order; card links with project number + title.
- `BackLink` may be part of CaseHero.
- MDX element map: `h2` display font uppercase 1.4rem; `p` body font `--muted` `line-height: 1.7`; `a` `--accent` hover underline; themed `ul/li`, `strong`, `code` (mono, faint bg). Register all in `mdxComponents`.

### 3.4 Seed ONE case study
Create `content/projects/rf-coupler-coax.mdx`: full frontmatter (`status: published`); body adapted from the matching section of `docs/project-case-study-drafts.md` — 3–6 paragraphs + one `Callout` with headline results (~40 dB coupling, 28 dB directivity, Monte Carlo tolerance study). **Honour the draft's "Source limits": claim simulation results only, not measured hardware performance.** Use the project thumbnail as the hero image; one `Figure` reusing it inline is acceptable as a placeholder.

### 3.5 Wire ONE row
In `projects-page.tsx`: wrap the project row in `<Link href={`/projects/${p.slug}`} className="prj-row-link">` **only when a content file exists** — implement as a `hasCaseStudy` boolean passed via props or a `caseStudySlugs` set imported from a tiny generated/static list (server-safe; `projects-page.tsx` is a client component, so pass the slug list down from a server parent or hardcode a `linkedSlugs` array for now — hardcode is fine, it's replaced in Checkpoint 4). Rows without case studies render exactly as before. Add `.prj-row-link { display: block; color: inherit; }` and hover lift `.prj-row-link:hover .prj-row { background: rgba(255, 243, 213, 0.025); }`. Replace the `->` text arrow with `ArrowRight` from `lucide-react` (`size={14}`) in `.prj-row-cta-arrow` on ALL rows; **update the layout-source test** CTA assertion from the `->` string to assert `ArrowRight`.

### 3.6 Tests
New `src/lib/case-studies.test.ts`: every MDX file's frontmatter validates; its slug exists in `projects.ts`; slugs unique; `heroImage` file exists. (The "every project has an MDX file" assertion comes in Checkpoint 4.)
Extend Playwright: click the RF coupler row → URL `/projects/rf-coupler-coax`, `h1` matches, back link returns to projects heading.

**Automated gate:** lint + test + build (must emit the static `/projects/rf-coupler-coax` route) + `npm run test:fluid`.

**Human verification:**
- [ ] Click the HFSS Directional Coupler card → case-study page loads instantly, dark theme matches the homepage (no white flash).
- [ ] Typography hierarchy looks right: eyebrow, big display title, summary, pills identical in style to the homepage cards, hero image bordered.
- [ ] Body prose is readable (measure ~760 px, comfortable line-height); Callout and any Figure look on-theme.
- [ ] Prev/next footer nav and back link work.
- [ ] **Review the seeded prose for factual accuracy** — this is your single most important check; the template will replicate whatever standard this page sets.
- [ ] Other 8 rows look and behave exactly as before (no link, no regression).
- [ ] Mobile width: case-study page is comfortable at 390 px.

**Commit:** `feat: MDX case-study system with proving page (rf-coupler-coax)` — push.

---

# Checkpoint 4 — Seed remaining case studies + wire all rows

1. Create the remaining 8 MDX files from their `docs/project-case-study-drafts.md` sections, same standard as the proving page. Set `status: draft` for thin sections (`artwork-collection`, and `wordpress-marketing` if thin); rest `published`. Always honour each draft's "Source limits" notes.
2. Remove the temporary `linkedSlugs` mechanism — link every row.
3. Extend `case-studies.test.ts`: every slug in `projects.ts` has a matching MDX file.
4. For projects where `docs/` lists PDF-able material but no prose works yet, frontmatter may include `pdf:` paths now; the files land later (page renders the interim layout only once both `pdf` exists in frontmatter AND body < 200 chars — if you wrote prose, prose wins).

**Automated gate:** lint + test + build (9 static project routes) + `npm run test:fluid`.

**Human verification:**
- [ ] Visit all 9 pages (use prev/next nav to walk the ring). Check each for: factual accuracy vs. what you actually did, tone, image crop.
- [ ] Draft-status pages render but you're comfortable with their current content (they're noindexed but publicly reachable).
- [ ] Every homepage row navigates; hover lift + gold CTA arrow feel consistent.

**Commit:** `feat: seed all case-study pages, link all project rows` — push.

---

# Checkpoint 5 — Filter refactor + markup/a11y

1. **State-driven filtering** in `projects-page.tsx` — delete `handleFilter`'s DOM walking, `wrap.style.display` writes, and `suppressHydrationWarning`:

```tsx
const visible = activeFocus === "all" ? projects : projects.filter((p) => p.focus === activeFocus);
// map over `visible`; key={p.id}
```

A `useEffect` watching `activeFocus` calls `resetRowRevealState` on all current `.prj-row-wrap` elements then `scheduleRowReveals()` (preserves the reveal-in transition). Keep the identifier `visibleRows` inside `updateRowReveals` to minimise source-test churn (the `display !== "none"` filter inside it can go).
2. **Test updates** in `project-card-layout-source.test.ts`: rewrite the filter-related assertions to the new invariant — component contains `projects.filter`, contains NO `style.display` writes (`expect(componentSource).not.toContain("style.display")`), retains `resetRowRevealState` + `scheduleRowReveals` on filter change, contains no `suppressHydrationWarning`.
3. `aria-pressed={activeFocus === val}` on filter pills.
4. Heading hierarchy: projects `h1` (`prj-head-title`) → `h2`; each `prj-row-title` `h2` → `h3`. Case-study `h1` stays. Verify Playwright role queries still pass.
5. Dev scaffolding: change the controls wrapper to `<div className="cursor-streamlet-controls" hidden aria-hidden="true">`. **Do not modify fluid.js for this** — it reads the inputs' values at startup; `hidden` keeps them in the DOM but out of the a11y tree and text extraction.
6. **Skip link** as first element in `<main>`: `<a className="skip-link" href="#projects">Skip to projects</a>` — visually hidden, visible on keyboard focus, pill style with `--accent`.

**Automated gate:** lint + test + build + `npm run test:fluid` (filter test must pass with unchanged behaviour). Zero hydration warnings in dev console.

**Human verification:**
- [ ] Filters behave identically: switching categories hides/reveals with the same fade-up animation; "All" restores everything.
- [ ] Rapidly toggling filters causes no flicker, stuck rows, or console errors.
- [ ] Tab from page load: first focus is the skip link; Enter jumps to projects.
- [ ] Dev console clean of hydration warnings.

**Commit:** `refactor: state-driven project filtering, heading hierarchy, skip link, a11y` — push.

---

# Checkpoint 6 — WebGL lifecycle (pause, reduced-motion, DPR)

Additive-only changes to both fluid.js files; bump both version suffixes in `scroll-journey.tsx` afterwards.

1. **Visibility pause:** in each file, `document.visibilitychange` — hidden cancels the rAF loop; visible restarts (guard double-start). The iframe document's visibility tracks the top page — no postMessage needed.
2. **Scrolled-past pause:** in `scroll-journey.tsx` `update()`, when `bgFade >= 0.999` post `{ type: "black-hole-render-state", running: false }` (dual-post like `postProgress`); below threshold, `running: true`. Post only on state change (ref of last value). Both fluid.js files handle it: stop/start loops. Update the shader source test if it asserts a closed message-type list.
3. **Reduced motion:** each fluid.js at init checks `matchMedia("(prefers-reduced-motion: reduce)").matches`. If true: render one frame, never start the loop, ignore `running: true`. The tsbxw3 shader additionally renders a single frame on each `black-hole-dive` progress message so the dive still works as a stepped-still experience.
4. **DPR clamp:** clamp every `devicePixelRatio` read with `Math.min(window.devicePixelRatio || 1, 2)`.
5. **Skip the cursor overlay entirely on touch devices.** The streamlet overlay (`public/black-hole-cursor-streamlets/fluid.js`, ~2 000 lines + a second WebGL2 context) is cursor-driven and useless on phones. In `scroll-journey.tsx`, before injecting the script: `const hasFinePointer = matchMedia("(hover: hover) and (pointer: fine)").matches;` — if false, do not inject the script and do not render the `#fluid-canvas` overlay canvas (conditional render via state set in the effect; SSR renders it, it unmounts on touch devices — acceptable). This removes an entire WebGL context, the script parse, and per-frame simulation from every phone.
6. **Idle-defer the cursor overlay on desktop.** Wrap the script injection in `requestIdleCallback(inject, { timeout: 2500 })` (fallback `setTimeout(inject, 1500)`). The hero shader paints first; streamlets join a moment later — imperceptible, and first-load main-thread contention drops.

**Automated gate:** lint + test + build + `npm run test:fluid`. Note: `black-hole-cursor-streamlets.test.ts` / the shader source test / the e2e may assert the script tag or overlay canvas presence — update assertions to the new invariant (fine-pointer gate + idle injection present in source) rather than deleting them.

**Human verification:**
- [ ] **Visual fidelity first:** before approving, compare the black hole against production side-by-side on your main display AND your phone — rest framing, dive, disk detail, and colours must be pixel-identical in feel. The only permitted differences are lifecycle (pause/resume, streamlet timing).
- [ ] **DPR clamp check:** if your display is >2x density, look closely at the accretion disk edge for softness vs. production. If you see ANY difference you dislike, tell the agent to drop the DPR clamp (item 4 only) — it's an optional optimisation, not a requirement.
- [ ] **Mobile streamlets check:** if production currently shows any streamlet/lighting ambience on your phone, and it's now gone and you miss it, tell the agent to drop the touch-skip (item 5 only).
- [ ] Normal browsing unchanged: hero animates, cursor streamlets respond (appearing within ~2 s of load), dive works.
- [ ] DevTools touch emulation: no `cursor-streamlets` script in the network tab, no overlay canvas in the DOM, hero shader still runs.
- [ ] Scroll fully into projects, open DevTools Performance monitor: GPU/CPU drops to idle (loops stopped). Scroll back up: animation resumes seamlessly.
- [ ] Switch tabs 10 s, return: resumes without visual glitch.
- [ ] DevTools → Rendering → Emulate `prefers-reduced-motion: reduce`, reload: static black-hole frame, dive scrolls as stepped stills, no continuous GPU work.

**Commit:** `perf: pause WebGL when hidden/scrolled past, reduced-motion support, DPR clamp` — push.

---

# Checkpoint 7 — Site furniture (footer, mini-nav, scroll cue, availability badge, 404)

1. **Footer** (`src/components/site-footer.tsx`; rendered at the bottom of the projects section AND below `NextProject` on case-study pages): hairline `--line-cool` top border; row 1 — GitHub (`https://github.com/liamkrivacic` — **verify handle with Liam**), LinkedIn (existing URL), email; row 2 mono `--dim` — `© 2026 Liam Krivacic · Built with Next.js + WebGL ·` "Source" → repo URL. **Resume link self-activates:** render `Resume (PDF)` → `/liam-krivacic-resume.pdf` only if `fs.existsSync(path.join(process.cwd(), "public", "liam-krivacic-resume.pdf"))` at build time (do the check in a server component and pass a boolean down).
2. **Availability badge** in the hero above the eyebrow: pill, gold dot, mono font, `--line` border, text from `const availability = "Open to internships — 2026/27"` defined next to `biography` in `scroll-journey.tsx`.
3. **Scroll cue** bottom-center of hero viewport: mono `Scroll to enter` + `↓` bobbing via CSS keyframes (2.2 s ease-in-out infinite); opacity `clamp(0, calc(1 - var(--dive, 0) * 3), 1)`; no bob under reduced motion.
4. **Mini-nav**: fixed top bar, CSS-only reveal `opacity: clamp(0, calc((var(--bg-fade, 0) - 0.9) * 10), 1)` with matching `pointer-events` gating (`pointer-events: none` until visible — easiest: wrap in a container that flips `pointer-events` via the same var with a `visibility` trick, or accept pointer-events on at opacity ~0.1+ using a second clamp on `visibility` is not animatable — implement with `pointer-events: var(--nav-pe, none)` set from the existing `update()` in scroll-journey when `bgFade > 0.9`, one extra CSS var, still no new listeners). Contents: "Liam Krivacic" → `/`; right: `Projects` (`/#projects`), `GitHub`, `Contact` (mailto). Static always-visible variant on case-study pages. `backdrop-filter: blur(10px)`, background `rgba(3,4,5,0.6)`.
5. **404** `src/app/not-found.tsx`: display-font `PAST THE EVENT HORIZON`, line `This page didn't escape. Nothing does.` in `--muted`, `primary-link` button to `/`. Pure CSS glow, no WebGL.

**Automated gate:** lint + test + build + `npm run test:fluid`.

**Human verification:**
- [ ] Hero: availability badge sits above the eyebrow without crowding; scroll cue bobs, fades immediately on scroll.
- [ ] Mini-nav: invisible AND unclickable during hero; fades in after the dive; links work; looks right on mobile.
- [ ] Footer on homepage and case-study pages; resume link correctly ABSENT (no PDF yet); all links correct — **confirm GitHub handle**.
- [ ] `/some-garbage-url` → themed 404, button returns home.

**Commit:** `feat: footer, mini-nav, scroll cue, availability badge, themed 404` — push.

---

# Checkpoint 8 — CI

Add `webServer` block to `playwright.config.mjs`: `command: "npm run start"`, `url: "http://127.0.0.1:3000"`, `reuseExistingServer: true`.

`.github/workflows/ci.yml`:

```yaml
name: CI
on:
  push: { branches: [main] }
  pull_request:
jobs:
  checks:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with: { node-version: 22, cache: npm }
      - run: npm ci
      - run: npm run lint
      - run: npm test
      - run: npm run build
      - run: npx playwright install --with-deps chromium
      - run: npm run test:fluid
```

**Automated gate:** local `npm run test:fluid` still works (webServer block must not break local runs with a dev server already up).

**Human verification:**
- [ ] After push, the Actions tab shows the workflow running and finishing green.
- [ ] (Optional) Enable branch protection requiring CI on main.

**Commit:** `ci: lint, unit, build, and Playwright e2e on every push` — push. *(This checkpoint is verified BY the push — push first, then watch the run; fix-forward if red.)*

---

# Checkpoint 9 — SEO bundle + final sweep

1. `src/app/layout.tsx`:

```tsx
export const metadata: Metadata = {
  metadataBase: new URL("https://liam-krivacic.vercel.app"), // swap when custom domain lands
  title: { default: "Liam Krivacic | EE + CS Portfolio", template: "%s | Liam Krivacic" },
  description: "Electrical Engineering and Computer Science portfolio: RF systems, robotics, infrastructure, and software.",
  openGraph: { type: "website", siteName: "Liam Krivacic", locale: "en_AU" },
  twitter: { card: "summary_large_image" },
};
export const viewport: Viewport = { themeColor: "#030405" };
```

2. `src/app/opengraph-image.tsx` via `ImageResponse`: 1200×630, `#030405` bg, faint gold radial glow, "LIAM KRIVACIC", subline `Electrical Engineering + Computer Science · RF · Robotics · Software`, gold rule. Try loading Archivo (fetch a TTF bundled in the route); if font loading is finicky in the OG runtime, default font with correct colors is acceptable.
3. `src/app/sitemap.ts` (`/` + published `/projects/*`) and `src/app/robots.ts` (allow all, sitemap ref).
4. JSON-LD `Person` in layout: name, `affiliation: UNSW Sydney`, `sameAs` LinkedIn + GitHub, email.
5. Verify case-study `generateMetadata` OG images resolve absolute via `metadataBase`.
6. **Mobile Playwright pass:** second test with `test.use({ ...devices["Pixel 7"] })` — hero heading visible, scroll to projects, tap first card navigates.
7. **README update:** new structure (`content/`, `src/app/projects/`, `src/components/case-study/`), the add-a-case-study workflow (create `content/projects/<slug>.mdx` → ensure slug in `src/data/projects.ts` → images in `public/projects/` → tests enforce consistency), CI badge, refreshed Status.

**Automated gate:** lint + test + build + full Playwright (desktop + mobile tests).

**Human verification:**
- [ ] Paste the deployed URL into an OG debugger (e.g. opengraph.xyz) — branded card with image, title, description.
- [ ] `/sitemap.xml` lists home + published case studies; `/robots.txt` serves.
- [ ] Share a case-study URL — per-project unfurl with its thumbnail.
- [ ] Lighthouse mobile on the deployed preview: Performance ≥ 85 (shader-limited), Accessibility ≥ 95, SEO ≥ 95.
- [ ] README's add-a-case-study instructions: follow them yourself for a dummy slug and confirm tests catch a missing MDX file; then delete the dummy.

**Commit:** `feat: OG image, metadata, sitemap, robots, JSON-LD; mobile e2e; README` — push.

---

# Checkpoint 10 — Visual & perceived-speed polish pass

Small, independent refinements. Implement all; each is low-risk.

1. **Shader first-frame fade-in.** On cold load the iframe can pop in after a beat of black/flash. Give `.journey-bg-frame` initial `opacity: 0` and a `transition: opacity 600ms ease`; in the tsbxw3 fluid.js, after the first successful frame render, post `{ type: "black-hole-ready" }` to the parent; `scroll-journey.tsx` handles it by adding a class that sets opacity to 1. Result: the hero materialises smoothly instead of popping. (Additive message type — same source-test caveat as Checkpoint 6.)
2. **Styled scrollbar.** Windows Chrome's default fat light scrollbar sits on top of the black-hole aesthetic on every Windows machine. Add to `globals.css`: `html { scrollbar-width: thin; scrollbar-color: rgba(255, 209, 102, 0.28) #060708; }` plus the `::-webkit-scrollbar` equivalents (width 10px, `#060708` track, `rgba(255,209,102,0.25)` thumb, rounded, hover brightens). Do the same inside the case-study pages (inherited automatically).
3. **Gradient-banding grain.** Near-black gradients band visibly on many monitors. Add a fixed, pointer-events-none, full-viewport overlay div with a tiny tiling noise texture (generate a 128×128 monochrome noise PNG ≤ 3 KB into `public/textures/grain.png`, or use an inline SVG `feTurbulence` data URI), `opacity: 0.035`, `mix-blend-mode: overlay`, `z-index` above backgrounds but below content. Verify it's invisible as texture but kills banding in the hero veil and case-study glow.
4. **Selection + focus styling.** `::selection { background: rgba(255, 209, 102, 0.25); color: var(--text); }` and a global `:focus-visible { outline: 2px solid var(--accent); outline-offset: 3px; border-radius: 2px; }` (remove any `outline: none` without replacement). Keyboard navigation should look deliberate, on-theme.
5. **Thumbnail hover zoom.** `.prj-row-img { transition: transform 400ms ease; }` and `.prj-row-link:hover .prj-row-img { transform: scale(1.04); }` with `overflow: hidden` on `.prj-row-img-col`. Disable under `prefers-reduced-motion`. (Layout-source test asserts on `.prj-row-img` CSS — append properties without breaking the asserted `height`/`object-fit` patterns.)
6. **Case-study mount fade.** Case-study main content gets a one-shot CSS animation: fade + 8px rise over 350ms ease-out on page load (`@keyframes case-enter`, applied to the content wrapper). No experimental View Transitions API — plain CSS only. Disabled under reduced motion.
7. **SVG + icon hygiene.** Run `svgo` over `public/skill-logos/*.svg` (preserve viewBox). Add `src/app/apple-icon.png` (180×180, black background, gold "LK" in the display font — generate with sharp or any image step) so iOS bookmarks aren't a blank tile.

**Automated gate:** lint + test + build + `npm run test:fluid`.

**Human verification:**
- [ ] Hard-refresh with cache disabled: hero fades in smoothly, no black flash or pop.
- [ ] On a Windows machine (or DevTools with overlay scrollbars off): scrollbar is thin, dark, gold-thumbed.
- [ ] Hero veil and case-study glow show no visible banding; grain itself is imperceptible at normal viewing distance.
- [ ] Select text anywhere: gold selection. Tab through the page: clear gold focus rings.
- [ ] Hovering a project row zooms its thumbnail subtly inside its frame (no overflow spill).
- [ ] Open any case study: content rises in gently once; reloading with reduced-motion emulated shows no animation.

**Commit:** `polish: shader fade-in, themed scrollbar, grain, selection/focus, hover zoom, mount fade` — push.

---

## Deferred / needs input from Liam (do NOT attempt)

- Resume PDF — `public/liam-krivacic-resume.pdf` (footer link self-activates).
- Case-study PDFs — `public/case-studies/`.
- Richer per-project prose and real photos/figures (the MDX system is the delivery vehicle; Liam supplies material per project later).
- Custom domain purchase + Vercel config; then update `metadataBase`.
- Optional later: `@vercel/analytics`, image lightbox on figures (native `<dialog>`), inlining the iframe shader as a React component (explicitly out of scope — high risk, low reward).
