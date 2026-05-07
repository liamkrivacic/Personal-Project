# Scroll Journey Redesign Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace the JS scroll-lock + wheel/touch hijack on the homepage with a single natively-scrolled page where `window.scrollY` drives the BH dive zoom, the black veil takeover, the projects-bg colour wash, and the projects fade-in via CSS variables.

**Architecture:** One client component (`ScrollJourney`) owns one rAF-throttled `scroll` listener that writes five CSS variables (`--dive`, `--veil`, `--bg-fade`, `--reveal-col`, `--reveal-list`) to `document.documentElement` and posts dive progress to the BH iframe. Three z-layers: a fixed BG layer (BH iframe + cursor canvas + veil + projects-wash), a 200vh dive section with a sticky hero pin, and the projects content in normal flow.

**Tech Stack:** Next.js 16 (App Router), React 19, TypeScript strict, Tailwind, plain CSS variables. No new libraries.

**Spec:** [docs/superpowers/specs/2026-05-06-scroll-journey-redesign-design.md](docs/superpowers/specs/2026-05-06-scroll-journey-redesign-design.md)

---

## File map

| Path | Change |
|---|---|
| `src/components/scroll-journey.tsx` | **Create.** Owns scroll controller + renders all three layers + `<ProjectsPage />`. |
| `src/app/page.tsx` | **Modify.** Replace `<OrbitalHeroTsbxw3 /> + <ProjectsPage />` with `<ScrollJourney />`. |
| `src/components/orbital/orbital-hero-tsbxw3.tsx` | **Delete.** All useful content is lifted into `scroll-journey.tsx`. |
| `src/components/projects/projects-page.tsx` | **Modify.** Remove the internal `useEffect` scroll listener and the `container.style.backgroundColor` interpolation. Keep filter logic verbatim. |
| `src/app/globals.css` | **Modify.** Remove `scroll-snap-type` + dead `.hero-*` / `.post-dive-projects` / `.project-panel-*` / `.project-plate-*` / `.project-media-*` / `.project-sticky-header` rules. Add `.journey`, `.journey-bg`, `.journey-bg-frame`, `.journey-bg-cursor`, `.journey-bg-veil`, `.journey-bg-projects-wash`, `.dive-section`, `.hero-pin`. Update `.hero-copy` to read `var(--dive)`. |
| `src/lib/black-hole-tsbxw3-shader.test.ts` | **Modify.** Point the hero-source assertions at `src/components/scroll-journey.tsx`; update class-name assertions to match the new layer markup. |

---

## Task 1: Remove scroll-snap from globals.css

Scroll-snap on `html`/`body` is what makes the current re-lock dance jumpy. Remove it as an isolated first commit so the rest of the plan starts from a calmer baseline. The existing scroll-lock logic still works without snap — the page will behave the same as today minus snap-jumps.

**Files:**
- Modify: `src/app/globals.css` (lines 24–41 area, plus `.hero-dive`, `.post-dive-projects`, `.project-panel-shell`)

- [ ] **Step 1: Remove `scroll-snap-type` from `html`**

In `src/app/globals.css`, the `html` rule currently has `scroll-snap-type: y mandatory;`. Delete that single line.

```css
/* Before */
html {
  min-height: 100%;
  overflow-x: hidden;
  scroll-behavior: smooth;
  scroll-padding-top: 0;
  scroll-snap-type: y mandatory;
  background: var(--bg);
}

/* After */
html {
  min-height: 100%;
  overflow-x: hidden;
  scroll-behavior: smooth;
  scroll-padding-top: 0;
  background: var(--bg);
}
```

- [ ] **Step 2: Remove `scroll-snap-type` from `body`**

```css
/* Before */
body {
  min-height: 100%;
  margin: 0;
  overflow-x: hidden;
  scroll-snap-type: y mandatory;
  background: var(--bg);
  color: var(--text);
  font-family: var(--body-font);
}

/* After */
body {
  min-height: 100%;
  margin: 0;
  overflow-x: hidden;
  background: var(--bg);
  color: var(--text);
  font-family: var(--body-font);
}
```

- [ ] **Step 3: Remove `scroll-snap-align` and `scroll-snap-stop` from `.hero-dive`**

```css
/* Before */
.hero-dive {
  min-height: 100dvh;
  height: 100dvh;
  overflow: hidden;
  overscroll-behavior: none;
  scroll-snap-align: start;
  scroll-snap-stop: always;
  background: ...;
}

/* After */
.hero-dive {
  min-height: 100dvh;
  height: 100dvh;
  overflow: hidden;
  overscroll-behavior: none;
  background: ...;
}
```

- [ ] **Step 4: Remove `scroll-snap-align` from `.post-dive-projects`**

```css
/* Before — keep everything except the last property */
.post-dive-projects {
  /* ... */
  scroll-snap-align: start;
}

/* After — drop the scroll-snap-align line */
```

- [ ] **Step 5: Remove `scroll-snap-align` and `scroll-snap-stop` from `.project-panel-shell`**

```css
/* Before */
.project-panel-shell {
  position: relative;
  height: 100svh;
  min-height: 100svh;
  overflow: clip;
  scroll-snap-align: start;
  scroll-snap-stop: always;
}

/* After */
.project-panel-shell {
  position: relative;
  height: 100svh;
  min-height: 100svh;
  overflow: clip;
}
```

- [ ] **Step 6: Verify the page still works**

Run dev server: `npm run dev -- --hostname 127.0.0.1 --port 5176`. Open `http://127.0.0.1:5176`. Wheel-scroll down through the dive — same dive behaviour as before, but the hero no longer snaps to the top of the viewport. Wheel back up — scroll-lock re-engages at top, dive reverses. This is functionally equivalent to today, minus snap.

- [ ] **Step 7: Commit**

```bash
git add src/app/globals.css
git commit -m "$(cat <<'EOF'
refactor(css): remove scroll-snap from html/body and snap targets

Snap was fighting the JS scroll-lock and producing the half-hero
overlap fixed in 97ee9a5. Removing it as a clean baseline before the
scroll-journey rewrite. Existing scroll-lock logic unchanged.
EOF
)"
```

---

## Task 2: Create the new ScrollJourney component

Drop the new client component into the codebase as a pure addition. It isn't wired up by `page.tsx` yet, so the live page is unaffected. This lets us land the bulk of the new code as one self-contained commit.

**Files:**
- Create: `src/components/scroll-journey.tsx`

- [ ] **Step 1: Create the component file**

Create `src/components/scroll-journey.tsx` with the full content below. This is the single source of truth for the new architecture — scroll controller, layered DOM, postMessage glue, cursor relay.

```tsx
"use client";

import { useEffect, useRef } from "react";
import { Mail } from "lucide-react";
import { ProjectsPage } from "@/components/projects/projects-page";

const biography =
  "UNSW Electrical Engineering and Computer Science student building RF hardware, robotics, infrastructure, and software systems that hold together when the constraints get physical.";

const iframeSrc = "/black-hole-tsbxw3/index.html?v=tsbxw3-3";
const cursorScriptSrc = "/black-hole-cursor-streamlets/fluid.js?v=old-cursor-4";

function clamp01(value: number) {
  return Math.min(Math.max(value, 0), 1);
}

function smoothstep01(value: number) {
  const c = clamp01(value);
  return c * c * (3 - 2 * c);
}

function resolveDiveProgress(depth: number) {
  const d = clamp01(depth);
  const captureWindow = clamp01((d - 0.48) / 0.52);
  const capture = smoothstep01(captureWindow);
  return clamp01(d + capture * 0.48);
}

export function ScrollJourney() {
  const frameRef = useRef<HTMLIFrameElement>(null);

  useEffect(() => {
    const frame = frameRef.current;
    if (!frame) return;

    const root = document.documentElement.style;
    let ticking = false;

    const postProgress = (p: number) => {
      const message = { type: "black-hole-dive", progress: p };
      frame.contentWindow?.postMessage(message, window.location.origin);
      window.postMessage(message, window.location.origin);
    };

    const postCursorLight = (clientX: number, clientY: number) => {
      window.postMessage(
        { type: "black-hole-cursor", target: "cursor-overlay", x: clientX, y: clientY },
        window.location.origin,
      );
    };

    const update = () => {
      const y = window.scrollY;
      const vh = window.innerHeight;

      const dive = clamp01(y / (1.8 * vh));
      const veil = smoothstep01((y - 1.3 * vh) / (0.7 * vh));
      const bgFade = clamp01((y - 2.0 * vh) / (0.8 * vh));
      const revealCol = smoothstep01((y - 2.0 * vh) / (0.6 * vh));
      const revealList = smoothstep01((y - 2.2 * vh) / (0.7 * vh));

      root.setProperty("--dive", dive.toFixed(4));
      root.setProperty("--veil", veil.toFixed(4));
      root.setProperty("--bg-fade", bgFade.toFixed(4));
      root.setProperty("--reveal-col", revealCol.toFixed(4));
      root.setProperty("--reveal-list", revealList.toFixed(4));

      postProgress(resolveDiveProgress(dive));
    };

    const onScroll = () => {
      if (ticking) return;
      ticking = true;
      requestAnimationFrame(() => {
        update();
        ticking = false;
      });
    };

    const onResize = () => update();

    const onPointerMove = (event: PointerEvent) => {
      postCursorLight(event.clientX, event.clientY);
    };

    const onMessage = (event: MessageEvent) => {
      if (event.origin !== window.location.origin || !event.data) return;
      if (event.data.type === "black-hole-cursor") {
        if (event.data.target === "cursor-overlay") return;
        postCursorLight(Number(event.data.x), Number(event.data.y));
      }
    };

    const onLoad = () => update();

    update();

    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("resize", onResize);
    window.addEventListener("pointermove", onPointerMove);
    window.addEventListener("message", onMessage);
    frame.addEventListener("load", onLoad);

    const scriptId = "black-hole-cursor-streamlets-script";
    if (!document.getElementById(scriptId)) {
      const script = document.createElement("script");
      script.id = scriptId;
      script.type = "module";
      script.src = cursorScriptSrc;
      document.body.appendChild(script);
    }

    return () => {
      window.removeEventListener("scroll", onScroll);
      window.removeEventListener("resize", onResize);
      window.removeEventListener("pointermove", onPointerMove);
      window.removeEventListener("message", onMessage);
      frame.removeEventListener("load", onLoad);
    };
  }, []);

  return (
    <main className="journey">
      <div className="journey-bg" aria-hidden="true">
        <iframe
          ref={frameRef}
          className="journey-bg-frame"
          src={iframeSrc}
          tabIndex={-1}
          title=""
          allow="autoplay"
        />
        <canvas id="fluid-canvas" className="journey-bg-cursor" aria-hidden="true" />
        <div className="journey-bg-veil" aria-hidden="true" />
        <div className="journey-bg-projects-wash" aria-hidden="true" />
      </div>

      <div className="cursor-streamlet-controls" aria-hidden="true">
        <input id="rimHeat" type="range" defaultValue="0.34" readOnly />
        <input id="swirl" type="range" defaultValue="2.92" readOnly />
        <input id="pull" type="range" defaultValue="0.98" readOnly />
        <input id="cursorHeat" type="range" defaultValue="0.9" readOnly />
        <input id="dissipation" type="range" defaultValue="0.984" readOnly />
        <button id="reset" type="button">Reset</button>
        <span id="status">initializing</span>
      </div>

      <section className="dive-section" aria-labelledby="hero-title-tsbxw3">
        <div className="hero-pin">
          <div className="hero-copy">
            <p className="eyebrow">Electrical Engineering + Computer Science</p>
            <h1 id="hero-title-tsbxw3">Liam Krivacic</h1>
            <p className="hero-summary">{biography}</p>
            <div className="hero-facts" aria-label="Profile summary">
              <span>UNSW</span>
              <span>RF + robotics</span>
              <span>Systems-minded builder</span>
            </div>
            <div className="hero-actions" aria-label="Primary actions">
              <a href="mailto:liam.krivacic@gmail.com" className="hero-link primary-link">
                <span>Contact</span>
                <Mail size={15} aria-hidden="true" />
              </a>
            </div>
          </div>
        </div>
      </section>

      <ProjectsPage />
    </main>
  );
}
```

- [ ] **Step 2: Verify it type-checks**

Run: `npx tsc --noEmit`
Expected: no errors. The component imports `ProjectsPage`, which still exports the same shape; nothing else has changed yet.

- [ ] **Step 3: Verify lint passes**

Run: `npm run lint`
Expected: passes. (If unused-var warnings appear because the file isn't imported anywhere yet, that's fine — they'll resolve in Task 4.)

- [ ] **Step 4: Commit**

```bash
git add src/components/scroll-journey.tsx
git commit -m "$(cat <<'EOF'
feat: add ScrollJourney component (not yet wired)

Single client component that owns one rAF-throttled scroll listener
driving --dive / --veil / --bg-fade / --reveal-col / --reveal-list.
Renders fixed BG layer (iframe + cursor canvas + veil + projects-wash),
200vh dive section with sticky hero pin, and ProjectsPage.

Replaces orbital-hero-tsbxw3 in the next commit.
EOF
)"
```

---

## Task 3: Add the new layer CSS to globals.css

Additive CSS for the new layer/pin/wash classes. The old `.hero-*` rules are still in place — both rule sets coexist briefly. This is safe because no markup uses the new class names yet.

**Files:**
- Modify: `src/app/globals.css` (append a new section before the existing `/* /projects page — prefixed .prj-* */` divider, around line 894)

- [ ] **Step 1: Insert the scroll-journey layer CSS**

Find the comment divider `/* ───── ... /projects page ... ───── */` near line 894 in `src/app/globals.css`. Immediately BEFORE that divider, insert this block:

```css
/* ─────────────────────────────────────────────────────────
   Scroll Journey — fixed BG + dive section + sticky hero pin
   Driven by --dive / --veil / --bg-fade / --reveal-col /
   --reveal-list, all set on document root by ScrollJourney.
   ───────────────────────────────────────────────────────── */

.journey {
  position: relative;
  min-height: 100dvh;
  background: #000;
}

.journey-bg {
  position: fixed;
  inset: 0;
  z-index: 0;
  pointer-events: none;
}

.journey-bg-frame {
  position: absolute;
  inset: 0;
  display: block;
  width: 100%;
  height: 100%;
  border: 0;
  background: #050302;
  pointer-events: auto;
}

.journey-bg-cursor {
  position: absolute;
  inset: 0;
  display: block;
  width: 100%;
  height: 100%;
  border: 0;
  background: transparent;
  mix-blend-mode: screen;
  opacity: calc(1 - var(--veil, 0));
  pointer-events: none;
}

.journey-bg-veil {
  position: absolute;
  inset: 0;
  background: #000;
  opacity: var(--veil, 0);
  pointer-events: none;
}

.journey-bg-projects-wash {
  position: absolute;
  inset: 0;
  background: #030405;
  opacity: var(--bg-fade, 0);
  pointer-events: none;
}

.dive-section {
  position: relative;
  z-index: 1;
  height: 200vh;
  pointer-events: none;
}

.hero-pin {
  position: sticky;
  top: 0;
  display: flex;
  align-items: center;
  width: min(100%, 760px);
  height: 100vh;
  padding: 40px 52px;
  pointer-events: none;
}

@media (max-width: 1120px) {
  .hero-pin {
    padding-inline: 32px;
  }
}

@media (max-width: 720px) {
  .hero-pin {
    align-items: flex-end;
    padding: 24px 18px 40px;
  }
}
```

- [ ] **Step 2: Verify lint/build still passes**

Run: `npm run lint`
Expected: passes.

Run: `npm run build`
Expected: passes. (The new classes aren't used yet but the CSS still compiles.)

- [ ] **Step 3: Commit**

```bash
git add src/app/globals.css
git commit -m "$(cat <<'EOF'
feat(css): add scroll-journey layer styles

Fixed BG + dive section + sticky hero pin classes for the new
architecture. Old .hero-* / .home-page rules still in place — they
get torn out alongside the component switchover.
EOF
)"
```

---

## Task 4: Atomic switchover

Wire `ScrollJourney` into `page.tsx`, simplify `ProjectsPage` (drop its scroll listener), delete the old `orbital-hero-tsbxw3.tsx`, and update the shader test to read from the new file. After this commit, the new architecture is live; the old hero component is gone.

The CSS variable contract for `.hero-copy` and `.prj-col` / `.prj-list` is the same shape as today (only renamed `--entry-progress` → `--dive`), so we update those in this same commit.

**Files:**
- Modify: `src/app/page.tsx`
- Modify: `src/components/projects/projects-page.tsx`
- Delete: `src/components/orbital/orbital-hero-tsbxw3.tsx`
- Modify: `src/lib/black-hole-tsbxw3-shader.test.ts`
- Modify: `src/app/globals.css` (rename `--entry-progress` → `--dive` in `.hero-copy` rule; update `.prj-page` background + remove `.prj-col` / `.prj-list` translateY only if needed — they already use the right variables, just confirm)

- [ ] **Step 1: Replace `src/app/page.tsx`**

Replace the entire file content with:

```tsx
import { ScrollJourney } from "@/components/scroll-journey";

export default function Home() {
  return <ScrollJourney />;
}
```

- [ ] **Step 2: Simplify `src/components/projects/projects-page.tsx`**

Open `src/components/projects/projects-page.tsx`. Three changes:

1. Remove the `useEffect` that reads `window.scrollY` and writes `--reveal-col` / `--reveal-list` / `backgroundColor`.
2. Remove the `containerRef` (it's only used by that `useEffect`).
3. Remove the `useEffect` import if it's no longer used.

Replace lines 1–60 (top of file through end of `handleFilter`) with:

```tsx
"use client";

import { useRef, useState } from "react";
import { projects } from "@/data/projects";

export function ProjectsPage() {
  const listRef = useRef<HTMLDivElement>(null);

  const [activeFilters, setActiveFilters] = useState<{ type: string; ctx: string }>({
    type: "all",
    ctx: "all",
  });

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
        wrap.style.opacity = "0";
        void wrap.offsetHeight;
        setTimeout(() => { wrap.style.opacity = ""; }, i * 80);
      } else {
        wrap.style.display = "none";
        wrap.style.opacity = "";
      }
    });
  }

  return (
    <div id="projects" className="prj-page">
```

(Everything from the SVG symbol definitions onward stays unchanged — leave the JSX from `{/* SVG symbol definitions ... */}` through the closing `</div>` exactly as it is. The only change to that block is removing `ref={containerRef}` from the wrapper `<div>`. Find the line `<div id="projects" className="prj-page" ref={containerRef}>` and change it to `<div id="projects" className="prj-page">`.)

- [ ] **Step 3: Delete `src/components/orbital/orbital-hero-tsbxw3.tsx`**

```bash
rm "src/components/orbital/orbital-hero-tsbxw3.tsx"
```

- [ ] **Step 4: Update the shader test to read from the new file and class names**

Replace the assertions in `src/lib/black-hole-tsbxw3-shader.test.ts` that currently target the old hero file with the equivalents that target `scroll-journey.tsx`. Open the file and:

1. Rename the variable `heroSource` → `journeySource` (mechanical: lines 12, 59–73).
2. Update the `readFileSync` path on lines 12–14 from `["src", "components", "orbital", "orbital-hero-tsbxw3.tsx"]` to `["src", "components", "scroll-journey.tsx"]`.
3. Update the class-name assertion on line 68 from `'className="hero-cursor-frame"'` to `'className="journey-bg-cursor"'`.
4. Remove the assertion on line 63 (`'const cursorCanvasRef = useRef<HTMLCanvasElement>(null);'`) — the new component does not use a ref to the cursor canvas (the streamlets script targets it by `id="fluid-canvas"`).
5. Update line 77 from `expect(cssSource).toContain(".hero-cursor-frame");` to `expect(cssSource).toContain(".journey-bg-cursor");`.

The negative assertions on lines 70–73 (`.not.toContain(...)`) all still hold for the new file — leave them.

After the edit, lines 7–80 of the test file should read:

```ts
  it("starts wider and left-biased, then blends to a centered dive target", () => {
    const shaderSource = readFileSync(
      join(process.cwd(), "public", "black-hole-tsbxw3", "fluid.js"),
      "utf8",
    );
    const journeySource = readFileSync(
      join(process.cwd(), "src", "components", "scroll-journey.tsx"),
      "utf8",
    );
    const cssSource = readFileSync(join(process.cwd(), "src", "app", "globals.css"), "utf8");
    const cursorOverlayPath = join(
      process.cwd(),
      "public",
      "black-hole-cursor-streamlets",
      "fluid.js",
    );
    const cursorOverlayHtmlPath = join(
      process.cwd(),
      "public",
      "black-hole-cursor-streamlets",
      "index.html",
    );
    const cursorOverlaySource = existsSync(cursorOverlayPath)
      ? readFileSync(cursorOverlayPath, "utf8")
      : "";
    const cursorOverlayHtml = existsSync(cursorOverlayHtmlPath)
      ? readFileSync(cursorOverlayHtmlPath, "utf8")
      : "";

    expect(shaderSource).toContain("const float REST_ZOOM_DISTANCE = 9.70;");
    expect(shaderSource).toContain("const float DIVE_ZOOM_DISTANCE = 0.42;");
    expect(shaderSource).toContain("const vec2 REST_FRAME_OFFSET = vec2(-0.032, -0.012);");
    expect(shaderSource).toContain("const vec2 DIVE_FRAME_OFFSET = vec2(0.0, 0.0);");
    expect(shaderSource).toContain("const float STAR_DRIFT_SPEED = 0.006;");
    expect(shaderSource).toContain("uv -= vec2(iTime * STAR_DRIFT_SPEED, 0.0);");
    expect(shaderSource).toContain("float focusT = smoothstep(0.18, 1.0, diveT);");
    expect(shaderSource).toContain(
      "vec2 centeredCoord = fragCoord - iResolution.xy * 0.5;",
    );
    expect(shaderSource).toContain(
      "vec2 frameOffset = mix(REST_FRAME_OFFSET, DIVE_FRAME_OFFSET, focusT);",
    );
    expect(shaderSource).toContain(
      "fragCoordRot += iResolution.xy * 0.5 + frameOffset * iResolution.xy;",
    );
    expect(shaderSource).toContain(
      "float zoomDistance = mix(REST_ZOOM_DISTANCE, DIVE_ZOOM_DISTANCE, smoothstep(0.0, 1.0, diveT));",
    );
    expect(shaderSource).toContain("float cameraLift = mix(0.05, 0.0, focusT);");
    expect(shaderSource).toContain(
      "angle.xy -= min(0.3 / dist, 3.14) * vec2(1.0, 0.5) * (1.0 - focusT);",
    );
    expect(journeySource).toContain('const iframeSrc = "/black-hole-tsbxw3/index.html?v=tsbxw3-3";');
    expect(journeySource).toContain(
      'const cursorScriptSrc = "/black-hole-cursor-streamlets/fluid.js?v=old-cursor-4";',
    );
    expect(journeySource).toContain("script.src = cursorScriptSrc;");
    expect(journeySource).toContain("window.postMessage(message, window.location.origin);");
    expect(journeySource).toContain("window.postMessage(");
    expect(journeySource).toContain('event.data.type === "black-hole-cursor"');
    expect(journeySource).toContain('className="journey-bg-cursor"');
    expect(journeySource).toContain('id="fluid-canvas"');
    expect(journeySource).not.toContain("cursorFrame.contentWindow");
    expect(journeySource).not.toContain('<iframe\n          ref={cursorFrameRef}');
    expect(journeySource).not.toContain('getContext("2d"');
    expect(journeySource).not.toContain("function renderWavefrontVisual(");
    expect(shaderSource).toContain('type: "black-hole-cursor"');
    expect(shaderSource).toContain("x: event.clientX");
    expect(shaderSource).toContain("y: event.clientY");
    expect(cssSource).toContain(".journey-bg-cursor");
    expect(cssSource).toContain("mix-blend-mode: screen;");
```

Note the last line was previously `.not.toContain("mix-blend-mode: screen;")` — flipped to `.toContain` because the new `.journey-bg-cursor` rule (added in Task 3) uses `mix-blend-mode: screen` to composite streamlets over the BH iframe.

Lines 79–111 (cursorOverlayHtml + cursorOverlaySource assertions) stay verbatim.

- [ ] **Step 5: Update `.hero-copy` CSS to read `var(--dive)`**

In `src/app/globals.css`, the existing `.hero-copy` block (around line 125) currently uses `var(--entry-progress)`. Replace the whole block:

```css
/* Before (around lines 125–136) */
.hero-copy {
  max-width: 620px;
  opacity: calc(1 - var(--entry-progress) * 1.18);
  transform: translate3d(0, calc(var(--entry-progress) * -34px), 0);
  transition: opacity 80ms linear;
}

.hero-home .hero-copy {
  max-width: 620px;
  opacity: 1;
  transform: none;
}

/* After */
.hero-copy {
  max-width: 620px;
  opacity: clamp(0, calc(1 - var(--dive, 0) * 1.42), 1);
  transform:
    translate3d(calc(var(--dive, 0) * -12px), calc(var(--dive, 0) * -28px), 0)
    scale(calc(1 - var(--dive, 0) * 0.08));
  filter: blur(calc(var(--dive, 0) * 1.1px));
  pointer-events: auto;
  transition: opacity 80ms linear;
}
```

(The new formula matches the old `.hero-dive .hero-copy` rule that overrides on dive — we collapse them into one rule since there's no longer a non-dive variant.)

- [ ] **Step 6: Make `.prj-page` background transparent**

In `src/app/globals.css`, find the `.prj-page` rule (around line 900):

```css
/* Before */
.prj-page {
  background: #000;
  color: var(--text);
  font-family: var(--body-font);
  min-height: 100vh;
}

/* After */
.prj-page {
  position: relative;
  z-index: 2;
  background: transparent;
  color: var(--text);
  font-family: var(--body-font);
  min-height: 100vh;
}
```

The `position: relative; z-index: 2` lifts projects content above the fixed BG layer. Background goes transparent so `--bg-fade`-driven `.journey-bg-projects-wash` shows through.

- [ ] **Step 7: Verify type-checks and lint pass**

Run: `npx tsc --noEmit`
Expected: passes. `OrbitalHeroTsbxw3` is no longer imported anywhere.

Run: `npm run lint`
Expected: passes.

- [ ] **Step 8: Run unit tests**

Run: `npm test`
Expected: 1 test passes (the updated shader-camera-framing test).

- [ ] **Step 9: Run a production build**

Run: `npm run build`
Expected: passes.

- [ ] **Step 10: Manual visual verification**

Run: `npm run dev -- --hostname 127.0.0.1 --port 5176`. Open `http://127.0.0.1:5176`.

Walk through the journey end-to-end:

1. **At top (`scrollY = 0`)**: BH visible at rest framing, hero copy fully opaque, cursor streamlets respond to mouse, projects invisible (below the fold and at `--reveal-col = 0`).
2. **Slow wheel down**: BH zoom progresses smoothly (postMessage progress increasing), hero copy fades + drifts up + blurs slightly. By ~130vh the black veil starts coming in. By 200vh, screen is fully black, cursor streamlets faded out.
3. **Continue scrolling 200 → 280vh**: projects-bg wash blends in (subtle), heading fades in with the same 20px upward drift the project rows use, list rows fade in just behind it.
4. **Past 290vh**: natural scroll through the project list, filter pills work.
5. **Scroll back to top**: everything reverses smoothly — projects fade out, veil lifts, BH un-zooms, hero copy returns to full opacity.
6. **Touch test (DevTools device emulation, "iPhone 14 Pro")**: same flow with finger drag. No jank, no sticky scroll-lock.
7. **Filter pills**: click "Software", "Hardware", "Robotics" — rows show/hide with the existing fade animation.
8. **Hard refresh while scrolled to mid-projects (~scrollY 400vh)**: the page restores to that position with projects already faded in, no flash of un-zoomed BH.

If any step misbehaves, fix before committing. Note: the `.post-dive-projects` / `.project-panel-*` CSS is still in `globals.css` at this point — that's expected; it'll be removed in Task 5.

- [ ] **Step 11: Commit**

```bash
git add src/app/page.tsx src/components/projects/projects-page.tsx \
        src/components/orbital/orbital-hero-tsbxw3.tsx \
        src/lib/black-hole-tsbxw3-shader.test.ts \
        src/app/globals.css
git commit -m "$(cat <<'EOF'
refactor: replace scroll-lock hero with native-scroll ScrollJourney

Wire ScrollJourney into page.tsx, drop the JS scroll listener inside
ProjectsPage, delete orbital-hero-tsbxw3.tsx, point the shader test at
the new component, rename --entry-progress → --dive, lift projects
content above the fixed BG layer.

The page is now one tall natively-scrolled document. window.scrollY
drives BH dive zoom, black veil takeover, projects-bg wash, and
heading/list fade-in via CSS variables. No wheel/touch hijack, no
overflow toggling, no scroll-snap.
EOF
)"
```

---

## Task 5: Remove dead CSS

The new architecture is live and verified. Sweep out the orphaned CSS rules from the old hero + the older project-journey component.

**Files:**
- Modify: `src/app/globals.css`

- [ ] **Step 1: Verify each candidate class is unreferenced in `src/`**

Run for each class:

```bash
grep -rn "home-page\|hero-home\|hero-background\|hero-background-frame\|hero-cursor-frame\|hero-shell\|hero-dive\|hero-dive-stage" src/ --include="*.tsx" --include="*.ts"
```

Expected: no output (only matches should be inside `globals.css` itself).

```bash
grep -rn "post-dive-projects\|project-sticky-header\|project-panel\|project-plate\|project-media" src/ --include="*.tsx" --include="*.ts"
```

Expected: no output.

If anything outside `globals.css` still references these classes, stop and investigate before continuing.

- [ ] **Step 2: Remove the `.home-page` rule and `--entry-progress` declaration**

Delete this block (around lines 52–58):

```css
.home-page {
  --entry-progress: 0;
  position: relative;
  min-height: 100dvh;
  overflow: clip;
  background: var(--bg-deep);
}
```

- [ ] **Step 3: Remove the old hero-section CSS**

Delete these blocks:

- `.hero-home { ... }` (lines 60–68)
- `.hero-home::before { ... }` (lines 70–79)
- `.hero-background { ... }` (lines 81–85)
- `.hero-background-frame { ... }` (lines 87–95)
- `.hero-cursor-frame { ... }` (lines 97–108)
- `.hero-shell { ... }` (lines 114–123)
- `.hero-dive { ... }` (lines 138–148)
- `.hero-dive-stage { ... }` (lines 150–155)
- `.hero-dive-stage::after { ... }` (lines 157–167)
- `.hero-dive-stage::before { ... }` (lines 169–177)
- `.hero-dive .hero-copy { ... }` (lines 179–185)

Keep: `:root`, `html`, `body`, `a`, `button`, `.cursor-streamlet-controls`, the `.eyebrow` / `.hero-copy h1` / `.hero-summary` / `.hero-actions` / `.hero-link` / `.hero-link:active` / `.hero-link:focus-visible` / `.primary-link` / `.hero-facts` / `.hero-facts span` rules (these style the hero copy children that still exist).

The `.hero-copy` block itself (the new one written in Task 4 Step 5) stays.

- [ ] **Step 4: Remove the old project-journey CSS**

Delete the entire block from `.post-dive-projects` (around line 281) through `.project-media-empty-3 .project-media-core` (around line 730), inclusive. Also remove the responsive overrides for these classes inside `@media (max-width: 1120px)` (lines 737–759) and `@media (max-width: 820px)` (lines 761–840).

The next surviving rule should be the responsive override `@media (max-width: 720px) { .hero-shell { ... } }` — wait, `.hero-shell` is being deleted. Update that media block to just keep `.hero-home::before` and `.hero-copy h1` overrides — but `.hero-home::before` is also gone. Both targets are dead.

Replacement for `@media (max-width: 720px)` (lines 842–857):

```css
@media (max-width: 720px) {
  .hero-copy h1 {
    font-size: clamp(3.1rem, 15vw, 4.2rem);
  }
}
```

(Drop the `.hero-shell` and `.hero-home::before` overrides; the responsive padding for `.hero-pin` was added in Task 3 Step 1.)

For `@media (max-width: 520px)` (lines 859–876), drop the `.project-plate-kicker` and `.project-plate-copy h2` overrides; keep `.project-header-nav button` only if it's still referenced — grep first. If `.project-header-nav` is unused (it is, it was inside `.post-dive-projects`), drop the whole `@media (max-width: 520px)` block.

- [ ] **Step 5: Drop `.cursor-streamlet-controls` from the kept list — verify it's still needed**

The `.cursor-streamlet-controls` rule (`display: none`) on line 110 hides the hidden range inputs. The new `ScrollJourney` component still renders those inputs (the streamlets script reads them by id), so KEEP this rule. No change.

- [ ] **Step 6: Verify lint and build still pass**

Run: `npm run lint`
Expected: passes.

Run: `npm run build`
Expected: passes.

- [ ] **Step 7: Manual visual verification**

Run dev server again. Reload the page. Walk through the same 8 checks from Task 4 Step 10. Nothing should look different from the post-Task-4 state — we only deleted unreferenced CSS rules.

- [ ] **Step 8: Commit**

```bash
git add src/app/globals.css
git commit -m "$(cat <<'EOF'
chore(css): remove dead hero-* and project-panel-* rules

The .hero-home / .hero-dive / .post-dive-projects / .project-plate /
.project-media classes are no longer referenced after the
ScrollJourney switchover. Sweep them out.
EOF
)"
```

---

## Task 6: Reduced-motion polish

The existing `@media (prefers-reduced-motion: reduce)` block forces `.hero-copy` to full opacity and no transform. With the new architecture, the projects fade-in (`--reveal-col` / `--reveal-list`) would leave reduced-motion users staring at invisible projects until they manually scroll past 280vh. Add an override.

**Files:**
- Modify: `src/app/globals.css`

- [ ] **Step 1: Extend the reduced-motion block**

Find the `@media (prefers-reduced-motion: reduce)` block (around lines 878–892). Replace its body:

```css
/* Before */
@media (prefers-reduced-motion: reduce) {
  *,
  *::before,
  *::after {
    animation-duration: 0.001ms !important;
    animation-iteration-count: 1 !important;
    scroll-behavior: auto !important;
    transition-duration: 0.001ms !important;
  }

  .hero-copy {
    transform: none !important;
    opacity: 1 !important;
  }
}

/* After */
@media (prefers-reduced-motion: reduce) {
  *,
  *::before,
  *::after {
    animation-duration: 0.001ms !important;
    animation-iteration-count: 1 !important;
    scroll-behavior: auto !important;
    transition-duration: 0.001ms !important;
  }

  .hero-copy {
    transform: none !important;
    opacity: 1 !important;
    filter: none !important;
  }

  .prj-col,
  .prj-list {
    opacity: 1 !important;
    transform: none !important;
  }
}
```

- [ ] **Step 2: Verify with reduced motion enabled**

In Chrome DevTools, open Rendering tab (Cmd-Shift-P → "Show Rendering"), set `Emulate CSS media feature prefers-reduced-motion` to `reduce`. Reload the page.

Expected:
- Hero copy: stays at full opacity, no blur, no drift, regardless of scroll.
- Projects: fully visible from the start (won't be visible to the eye until scrolled into the viewport, but if you do scroll past 200vh they're already there at full opacity, no fade).
- BH dive zoom: still happens (the iframe shader runs independently of CSS reduced-motion — acceptable trade-off; user can mute by closing the tab).

Toggle reduced-motion off in DevTools and reload to confirm the normal animated behaviour returns.

- [ ] **Step 3: Commit**

```bash
git add src/app/globals.css
git commit -m "$(cat <<'EOF'
a11y(css): respect prefers-reduced-motion for hero copy and projects

Pin .hero-copy and .prj-col / .prj-list to full opacity / no transform
under prefers-reduced-motion: reduce so the page stays usable without
the scroll-driven fade. BH iframe zoom still runs (shader-side, out
of CSS reach).
EOF
)"
```

---

## Self-review checks (run before declaring done)

- [ ] `npm test` — passes (1 test).
- [ ] `npm run lint` — passes.
- [ ] `npm run build` — passes.
- [ ] Manual journey walk-through (Task 4 Step 10) — all 8 checks green.
- [ ] Reduced-motion check (Task 6 Step 2) — passes.
- [ ] `grep -rn "OrbitalHeroTsbxw3\|orbital-hero-tsbxw3\|--entry-progress\|hero-cursor-frame\|home-page\|hero-home\|hero-background\|hero-shell\|hero-dive" src/` returns nothing.
- [ ] `git log --oneline shader-unified-blackhole-2026-04-30 ^main | head -10` shows 6 new commits on top of the spec commit (one per task, plus the spec).
