# Scroll Journey Redesign

**Date:** 2026-05-06
**Branch context:** `shader-unified-blackhole-2026-04-30`
**Replaces:** the JS-driven scroll-lock + wheel/touch hijack + re-lock recovery system in `src/components/orbital/orbital-hero-tsbxw3.tsx` and the duplicated scroll listener in `src/components/projects/projects-page.tsx`.

## Goal

A single continuous, scroll-driven journey from hero → black-hole dive → fade-in of projects → natural project list scroll, fully reversible. No timers, no auto-scroll, no scroll-snap, no scroll lock. Pure `window.scrollY` driving everything.

## Why the rewrite

The current implementation:

- Locks `document.documentElement` / `document.body` overflow during the dive, intercepts wheel + touch, and "fakes" scroll by computing depth from event deltas.
- Releases scroll once dive progress reaches ~1.0, then re-locks if the user scrolls back to `scrollY < 4`.
- Uses `scroll-snap-type: y mandatory` on `html` and `body`, which fights the lock/release transitions and produces half-hero overlap and re-lock-at-zero races (commits `b8f7e9e` and `97ee9a5` are workarounds).
- Has a separate scroll listener inside `ProjectsPage` that reads `window.scrollY` directly, but the hero owns whether the page is actually scrollable, so the two listeners' notions of "scroll progress" are inconsistent.

The result is brittle, hard to reason about, and visibly jumpy at boundaries.

The new design replaces all of that with one rAF-throttled scroll listener that writes CSS variables to `document.documentElement` and posts dive progress to the BH iframe. Everything visual is a function of those variables. The page is one tall natively-scrolled document.

## Architecture

### Layer stack

Three z-layers, in document order:

1. **Fixed background layer** (`position: fixed; inset: 0; z-index: 0`)
   - BH iframe (`<iframe src="/black-hole-tsbxw3/index.html?v=tsbxw3-3">`) — fills the viewport, never moves. Receives `postMessage({type:'black-hole-dive', progress})` on scroll.
   - Cursor-streamlets canvas (`#fluid-canvas`) — same as today, fills viewport, opacity tied to `1 - var(--veil)` so the streamlets fade out as the screen blacks out.
   - Black veil (`position: absolute; inset: 0; background:#000; opacity: var(--veil)`) — locks the screen to pure black at end of dive regardless of what the shader emits.
   - Projects-bg colour wash (`position: absolute; inset: 0; background:#030405; opacity: var(--bg-fade)`) — blends from black to projects bg as the user crosses into projects territory.

2. **Dive section** (`position: relative; height: 200vh; z-index: 1`)
   - A sticky hero-copy pin (`position: sticky; top: 0; height: 100vh`) holding the existing copy block: eyebrow, h1, summary, hero-facts, contact CTA.
   - Hero copy fades + drifts + blurs with `--dive` (same formulas as today's `--entry-progress`, just renamed).

3. **Projects content** (`position: relative; z-index: 2`)
   - The existing `ProjectsPage` markup (header + filter bar + project list).
   - Heading column and list both fade in with opacity 0→1 + `translateY(20px → 0)` driven by `--reveal-col` and `--reveal-list` (slight stagger, identical drift to current row reveal — which the user explicitly wants for cross-page consistency).
   - Filter behaviour (per-row show/hide on filter change) unchanged.

The fixed background layer renders BEHIND everything. The dive section provides 200vh of scroll distance for the BH zoom + hero copy fade + veil takeover. After the dive section, projects content sits in normal document flow at `scrollY = 200vh` and fades in over the next ~80vh.

### Scroll math

A single rAF-throttled `scroll` listener computes these values and writes them to `document.documentElement.style`:

| Variable | Range (`scrollY`, in viewport heights) | Drives |
|---|---|---|
| `--dive` (raw 0→1) | 0 → 180vh | Posted to BH iframe via `postMessage` after passing through the existing `resolveDiveProgress` curve. Also drives hero copy opacity/transform/blur. |
| `--veil` (0→1) | 130 → 200vh | Black overlay opacity. Also (as `1 - --veil`) cursor canvas opacity. |
| `--bg-fade` (0→1) | 200 → 280vh | Projects-bg colour wash opacity (black → `#030405`). |
| `--reveal-col` (0→1) | 200 → 260vh | Projects heading + filter bar opacity + 20px translateY drift. |
| `--reveal-list` (0→1) | 220 → 290vh | Project list opacity + 20px translateY drift. (Slight stagger behind heading.) |

Easing per variable: `--dive` is linear-clamped (the BH zoom curve already lives inside `resolveDiveProgress`). `--veil`, `--reveal-col`, `--reveal-list` use `smoothstep01`. `--bg-fade` is linear-clamped (it's a near-imperceptible black-to-near-black transition; smoothstep is overkill).

The listener also calls `iframe.contentWindow.postMessage({type:'black-hole-dive', progress: resolveDiveProgress(dive)}, origin)` on every update, preserving the existing dive curve so the BH zoom feel is unchanged.

### Reverse direction

All variables are pure functions of `scrollY`. Scrolling back up recomputes each value from current `scrollY` — projects fade out, bg returns to black, veil lifts, BH un-zooms, hero copy returns. No state machine, no "did we already release" flag.

## Component breakdown

### `src/app/page.tsx`

Stays a server component. Renders the new client component:

```tsx
import { ScrollJourney } from "@/components/scroll-journey";
export default function Home() {
  return <ScrollJourney />;
}
```

### `src/components/scroll-journey.tsx` (new, client)

Owns the single scroll controller. Responsibilities:

- Mount the cursor-streamlets script (existing `cursorScriptSrc` logic, lifted from current hero).
- One rAF-throttled `scroll` listener that:
  - Reads `window.scrollY`, computes `--dive`, `--veil`, `--bg-fade`, `--reveal-col`, `--reveal-list`.
  - Writes them to `document.documentElement.style`.
  - Posts dive progress to the BH iframe (queried by ref).
- One pointer-move listener on `window` (or on the journey root) that posts cursor position to the streamlets canvas (existing `postCursorLight` logic).
- Renders the fixed BG layer, the dive section, and `<ProjectsPage />`.
- Initial paint: compute and write all variables once based on `window.scrollY` at mount (handles refresh-mid-scroll without a flash).

```tsx
"use client";
import { useEffect, useRef } from "react";
import { ProjectsPage } from "@/components/projects/projects-page";
import { Mail } from "lucide-react";

export function ScrollJourney() {
  const frameRef = useRef<HTMLIFrameElement>(null);
  // ...effect with rAF scroll handler...
  return (
    <main className="journey">
      <div className="journey-bg" aria-hidden="true">
        <iframe ref={frameRef} className="journey-bg-frame" src={iframeSrc} ... />
        <canvas id="fluid-canvas" className="journey-bg-cursor" aria-hidden="true" />
        <div className="journey-bg-veil" />
        <div className="journey-bg-projects-wash" />
      </div>

      <section className="dive-section" aria-labelledby="hero-title-tsbxw3">
        <div className="hero-pin">
          <div className="hero-copy">
            <p className="eyebrow">…</p>
            <h1 id="hero-title-tsbxw3">Liam Krivacic</h1>
            …
          </div>
        </div>
      </section>

      <ProjectsPage />
    </main>
  );
}
```

### `src/components/orbital/orbital-hero-tsbxw3.tsx`

Deleted. Its content (hero copy markup, iframe URL constant, cursor script URL, `resolveDiveProgress` helper) moves into `scroll-journey.tsx`. The control bar `<div class="cursor-streamlet-controls">` of hidden range inputs goes with it (the streamlets script reads them by id).

### `src/components/projects/projects-page.tsx`

Simplified:

- Remove the internal `useEffect` that reads `window.scrollY` and writes `--reveal-col` / `--reveal-list` / `backgroundColor`.
- Read those CSS variables from the root via the existing CSS rules — no JS scroll listener needed.
- Drop the inline `container.style.backgroundColor = ...` interpolation; the projects-bg colour wash in the fixed BG layer handles that now.
- Keep filter logic (`handleFilter`) verbatim.

### `src/app/globals.css`

**Remove:**
- `scroll-snap-type: y mandatory` from `html` and `body`.
- `scroll-snap-align`, `scroll-snap-stop`, `scroll-snap-type` from `.hero-dive`, `.post-dive-projects`, `.project-panel-shell`.
- `min-height: 100dvh; height: 100dvh; overflow: hidden` from `.hero-dive` (it's no longer the only viewport content).
- The post-dive grain overlay logic and `.has-revealed` toggle on `.project-panel-shell` (those served the old project-panel-stack journey, which is gone — confirm via grep before removing).

**Adjust:**
- `.prj-page` becomes `background: transparent` so the fixed BG layer's projects-wash (driven by `--bg-fade`) shows through. The current JS-driven `container.style.backgroundColor = ...` interpolation is removed.
- `.prj-col` and `.prj-list` keep their existing `opacity: var(--reveal-col, 0)` / `var(--reveal-list, 0)` and `translateY(20px → 0)` rules verbatim — variable names already match.
- Hero copy rules (`.hero-dive .hero-copy`) renamed to `.hero-copy` and read `var(--dive)` instead of `var(--entry-progress)`.

**Add:**
- `.journey` (the main wrapper).
- `.journey-bg`, `.journey-bg-frame`, `.journey-bg-cursor`, `.journey-bg-veil`, `.journey-bg-projects-wash` (fixed layer + children).
- `.dive-section { position: relative; height: 200vh; }`.
- `.hero-pin { position: sticky; top: 0; height: 100vh; display: flex; … }`.

## Scroll listener contract

```ts
let ticking = false;
function onScroll() {
  if (ticking) return;
  ticking = true;
  requestAnimationFrame(() => {
    update();
    ticking = false;
  });
}

function update() {
  const y = window.scrollY;
  const vh = window.innerHeight;

  const dive = clamp01(y / (1.8 * vh));
  const veil = smoothstep01((y - 1.3 * vh) / (0.7 * vh));
  const bgFade = clamp01((y - 2.0 * vh) / (0.8 * vh));
  const revealCol = smoothstep01((y - 2.0 * vh) / (0.6 * vh));
  const revealList = smoothstep01((y - 2.2 * vh) / (0.7 * vh));

  const root = document.documentElement.style;
  root.setProperty("--dive", dive.toFixed(4));
  root.setProperty("--veil", veil.toFixed(4));
  root.setProperty("--bg-fade", bgFade.toFixed(4));
  root.setProperty("--reveal-col", revealCol.toFixed(4));
  root.setProperty("--reveal-list", revealList.toFixed(4));

  frameRef.current?.contentWindow?.postMessage(
    { type: "black-hole-dive", progress: resolveDiveProgress(dive) },
    window.location.origin,
  );
}
```

`update()` runs once on mount (initial paint), and on every `scroll` and `resize` event.

## Edge cases

- **Refresh mid-scroll.** Browser restores `scrollY`. The mount-time `update()` writes correct vars before first paint; no flash of un-zoomed BH or invisible projects.
- **`prefers-reduced-motion: reduce`.** Existing rule (`.hero-copy { transform: none !important; opacity: 1 !important; }`) preserved; we should add a similar override on `.prj-col` / `.prj-list` so projects don't stay invisible if a reduced-motion user lands at top. Acceptable trade-off: dive zoom still happens at the BH-shader level; CSS can't override the iframe.
- **Resize.** `update()` re-runs on resize; thresholds are in `vh` units so they self-adjust.
- **Anchor link to `#projects`.** Native browser scroll-to-anchor works; `update()` fires through scroll events. No special handling.
- **iframe load order.** `update()` posts dive progress every tick, so even if the iframe loads after the first scroll event, subsequent updates land. Optionally: also post on iframe `load` event (preserve existing `handleLoad`).
- **Cursor-streamlets script.** Loaded once at mount via injected `<script>` tag, same as today. The script targets `#fluid-canvas`; canvas now lives in the fixed BG layer instead of the hero scene, but the script doesn't care about parent location.

## What is removed

- All scroll-lock state: `lockPageScroll`, `releasePageScroll`, `releasedForProjects`, `hasScrolledAway`, `previousHtmlOverflow`, `previousBodyOverflow`, `previousHtmlOverscroll`, `previousBodyOverscroll`.
- All wheel and touch handlers (`handleWheel`, `handleTouchStart`, `handleTouchMove`, `handleTouchEnd`, `touchY`).
- The `handlePageScroll` re-lock-when-near-top logic.
- The `handleMessage` dive-input branch (no longer needed — no incoming wheel deltas to translate).
- `scroll-snap-type` everywhere.
- `ProjectsPage`'s internal scroll listener and the `container.style.backgroundColor` interpolation.

The `handleMessage` cursor-light relay branch is preserved (the iframe forwards pointer events from inside it back to the parent for the streamlets canvas).

## Testing approach

Manual visual verification via `npm run dev -- --hostname 127.0.0.1 --port 5176`:

1. Load page at `scrollY = 0`. BH visible, hero copy fully opaque, projects invisible below the fold (in DOM but at full transparency since `--reveal-col = 0`).
2. Slowly wheel down. Hero copy fades + drifts up. BH iframe zooms (postMessage progress increasing). Around 130vh, black veil starts coming in. By 200vh, screen is pure black.
3. Continue scrolling. Projects-bg wash fades in (subtle since `#030405` is near-black). Projects heading fades in with 20px upward drift. Around 220vh, list rows begin fading in with the same drift.
4. Past 290vh, scroll feels natural and the list scrolls normally.
5. Scroll back up. Everything reverses smoothly: projects fade out, veil lifts, BH un-zooms, hero copy returns.
6. Touch test on mobile (DevTools device emulation + a real phone if possible): same flow, no jank from missing touch handlers (browser handles natively).
7. Filter pills still work in the projects list.
8. `prefers-reduced-motion: reduce` (DevTools rendering panel): hero copy stays put; projects respect the reduced-motion override.

No automated tests are required for this redesign — the existing `npm test` (Vitest) covers shader GLSL function presence, which this change doesn't touch. The `npm run test:fluid` Playwright smoke tests will run the dev server; if any of them assert on scroll-locked behaviour they need to be updated, but a quick grep shows they only check for the iframe loading and basic visibility, which still works.

## Out of scope

- Black-hole shader changes (disc continuity issue tracked separately).
- Project list interactions beyond fade-in (case-study routing, hover states, etc.).
- Mobile-specific tuning of dive thresholds (the spec uses a single set of vh-based thresholds; if mobile feels too long/short, tune in implementation, not spec).
- Removal of the unused `.post-dive-projects` / `.project-panel-shell` CSS — confirm they're no longer referenced anywhere and remove in a separate cleanup commit if so.
