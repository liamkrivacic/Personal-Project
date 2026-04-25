# Plasma Orbital Prototype Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build a standalone static prototype of the approved Plasma Field / Orbital Map portfolio homepage.

**Architecture:** Create an isolated browser prototype in `design/plasma-orbital/` before scaffolding the production Next.js app. Keep physics math in a small pure module with Node tests, keep project content in a data module, and keep DOM/pointer behavior in one UI module.

**Tech Stack:** HTML, CSS, JavaScript ES modules, Node built-in test runner, browser pointer events.

---

## File Structure

- Create `design/plasma-orbital/orbit-model.mjs`: pure orbital position, drag, throw, velocity cap, and spring-return helpers.
- Create `design/plasma-orbital/orbit-model.test.mjs`: Node tests for the pure physics helpers.
- Create `design/plasma-orbital/projects.mjs`: project capsule data and readout copy.
- Create `design/plasma-orbital/index.html`: static prototype shell and semantic content regions.
- Create `design/plasma-orbital/styles.css`: visual design, orbital field, black-hole center, fast signal traces, responsive rules, reduced-motion rules.
- Create `design/plasma-orbital/app.mjs`: render capsules, update readout, run animation loop, handle grab/throw/return pointer interactions.
- Create `design/plasma-orbital/README.md`: how to open, test, and evaluate the prototype.

The workspace is not currently a git repository, so this plan omits commit steps. Initialize git before production app scaffolding if commit checkpoints are needed.

---

### Task 1: Physics Model

**Files:**
- Create: `design/plasma-orbital/orbit-model.test.mjs`
- Create: `design/plasma-orbital/orbit-model.mjs`

- [ ] **Step 1: Create the failing physics tests**

Create `design/plasma-orbital/orbit-model.test.mjs` with this content:

```js
import test from "node:test";
import assert from "node:assert/strict";

import {
  beginDrag,
  createBody,
  moveDrag,
  orbitPosition,
  releaseDrag,
  stepBody,
} from "./orbit-model.mjs";

test("orbitPosition returns the expected ellipse point", () => {
  const body = createBody({
    id: "rf-plasma",
    orbitX: 200,
    orbitY: 100,
    radiusX: 80,
    radiusY: 40,
    angle: 0,
    speed: 0,
  });

  assert.deepEqual(orbitPosition(body, 0), { x: 280, y: 100 });
});

test("dragging preserves the pointer offset from the body center", () => {
  const body = createBody({
    id: "rf-plasma",
    orbitX: 200,
    orbitY: 100,
    radiusX: 80,
    radiusY: 40,
    angle: 0,
    speed: 0,
  });

  const dragged = beginDrag(body, { x: 260, y: 90 });
  const moved = moveDrag(dragged, { x: 300, y: 130 });

  assert.equal(moved.mode, "drag");
  assert.equal(moved.x, 320);
  assert.equal(moved.y, 140);
});

test("releaseDrag caps throw velocity so capsules cannot fly away", () => {
  const body = createBody({
    id: "rf-plasma",
    orbitX: 200,
    orbitY: 100,
    radiusX: 80,
    radiusY: 40,
    angle: 0,
    speed: 0,
  });

  const released = releaseDrag(body, { x: 4000, y: -4000 });

  assert.equal(released.mode, "return");
  assert.equal(released.vx, 1400);
  assert.equal(released.vy, -1400);
});

test("stepBody pulls a released body back toward its orbit target", () => {
  const body = {
    ...createBody({
      id: "rf-plasma",
      orbitX: 200,
      orbitY: 100,
      radiusX: 80,
      radiusY: 40,
      angle: 0,
      speed: 0,
    }),
    mode: "return",
    x: 100,
    y: 100,
    vx: 0,
    vy: 0,
  };

  const next = stepBody(body, {
    elapsedSeconds: 0,
    dtSeconds: 1 / 60,
    spring: 22,
    damping: 7,
  });

  assert.equal(next.mode, "return");
  assert.ok(next.x > body.x);
  assert.ok(next.vx > 0);
});
```

- [ ] **Step 2: Run the physics tests and verify they fail**

Run:

```powershell
node --test design/plasma-orbital/orbit-model.test.mjs
```

Expected: FAIL with a module-not-found error for `orbit-model.mjs`.

- [ ] **Step 3: Implement the physics model**

Create `design/plasma-orbital/orbit-model.mjs` with this content:

```js
const MAX_THROW_VELOCITY = 1400;

export function createBody({
  id,
  orbitX,
  orbitY,
  radiusX,
  radiusY,
  angle,
  speed,
}) {
  const position = orbitPosition(
    { orbitX, orbitY, radiusX, radiusY, angle, speed },
    0,
  );

  return {
    id,
    orbitX,
    orbitY,
    radiusX,
    radiusY,
    angle,
    speed,
    x: position.x,
    y: position.y,
    vx: 0,
    vy: 0,
    mode: "orbit",
    dragOffsetX: 0,
    dragOffsetY: 0,
  };
}

export function orbitPosition(body, elapsedSeconds) {
  const angle = body.angle + elapsedSeconds * body.speed;

  return {
    x: body.orbitX + Math.cos(angle) * body.radiusX,
    y: body.orbitY + Math.sin(angle) * body.radiusY,
  };
}

export function beginDrag(body, pointer) {
  return {
    ...body,
    mode: "drag",
    vx: 0,
    vy: 0,
    dragOffsetX: body.x - pointer.x,
    dragOffsetY: body.y - pointer.y,
  };
}

export function moveDrag(body, pointer) {
  if (body.mode !== "drag") {
    return body;
  }

  return {
    ...body,
    x: pointer.x + body.dragOffsetX,
    y: pointer.y + body.dragOffsetY,
  };
}

export function releaseDrag(body, velocity) {
  return {
    ...body,
    mode: "return",
    vx: clamp(velocity.x, -MAX_THROW_VELOCITY, MAX_THROW_VELOCITY),
    vy: clamp(velocity.y, -MAX_THROW_VELOCITY, MAX_THROW_VELOCITY),
    dragOffsetX: 0,
    dragOffsetY: 0,
  };
}

export function stepBody(
  body,
  {
    elapsedSeconds,
    dtSeconds,
    spring = 18,
    damping = 6,
    snapDistance = 0.75,
    snapVelocity = 6,
  },
) {
  if (body.mode === "drag") {
    return body;
  }

  const target = orbitPosition(body, elapsedSeconds);

  if (body.mode === "orbit") {
    return {
      ...body,
      x: target.x,
      y: target.y,
      vx: 0,
      vy: 0,
    };
  }

  const ax = (target.x - body.x) * spring;
  const ay = (target.y - body.y) * spring;
  const decay = Math.exp(-damping * dtSeconds);
  const vx = (body.vx + ax * dtSeconds) * decay;
  const vy = (body.vy + ay * dtSeconds) * decay;
  const x = body.x + vx * dtSeconds;
  const y = body.y + vy * dtSeconds;

  const distance = Math.hypot(target.x - x, target.y - y);
  const speed = Math.hypot(vx, vy);

  if (distance < snapDistance && speed < snapVelocity) {
    return {
      ...body,
      mode: "orbit",
      x: target.x,
      y: target.y,
      vx: 0,
      vy: 0,
    };
  }

  return {
    ...body,
    mode: "return",
    x,
    y,
    vx,
    vy,
  };
}

function clamp(value, min, max) {
  return Math.min(Math.max(value, min), max);
}
```

- [ ] **Step 4: Run the physics tests and verify they pass**

Run:

```powershell
node --test design/plasma-orbital/orbit-model.test.mjs
```

Expected: PASS with 4 passing tests.

---

### Task 2: Static Orbital Scene

**Files:**
- Create: `design/plasma-orbital/projects.mjs`
- Create: `design/plasma-orbital/index.html`
- Create: `design/plasma-orbital/styles.css`

- [ ] **Step 1: Create the project data module**

Create `design/plasma-orbital/projects.mjs` with this content:

```js
export const projects = [
  {
    id: "rf-plasma",
    name: "RF Plasma",
    category: "hardware",
    color: "#67e8f9",
    angle: -0.72,
    radiusXRatio: 0.34,
    radiusYRatio: 0.22,
    speed: 0.09,
    summary:
      "High-power RF system design, waveguide simulation, impedance matching, measurement planning, and safety documentation.",
    meta: "AtomCraft / Team Lead",
  },
  {
    id: "fmcg-web",
    name: "FMCG Web",
    category: "systems",
    color: "#facc15",
    angle: 0.2,
    radiusXRatio: 0.4,
    radiusYRatio: 0.3,
    speed: 0.065,
    summary:
      "Company websites, DNS, hosting, SSL security, performance work, and NAS-hosted infrastructure.",
    meta: "FMCG Industry Solutions",
  },
  {
    id: "sumobot",
    name: "SumoBot",
    category: "robotics",
    color: "#fb7185",
    angle: 2.2,
    radiusXRatio: 0.38,
    radiusYRatio: 0.27,
    speed: 0.08,
    summary:
      "Autonomous sumo robot with sensors, control algorithms, and competition-first mechanical decisions.",
    meta: "UNSW SumoBots / 1st Place",
  },
  {
    id: "lab-demo",
    name: "Lab Demo",
    category: "teaching",
    color: "#b9f6ca",
    angle: 3.38,
    radiusXRatio: 0.31,
    radiusYRatio: 0.2,
    speed: 0.055,
    summary:
      "Coordinated lab sessions, guided undergraduates, and supported safe use of electrical equipment.",
    meta: "UNSW / Lab Demonstrator",
  },
];
```

- [ ] **Step 2: Create the HTML shell**

Create `design/plasma-orbital/index.html` with this content:

```html
<!doctype html>
<html lang="en">
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <title>Liam Krivacic — Plasma Orbital Portfolio Prototype</title>
    <meta
      name="description"
      content="Prototype for Liam Krivacic's plasma orbital portfolio homepage."
    />
    <link rel="stylesheet" href="./styles.css" />
  </head>
  <body>
    <main class="orbital-page" aria-labelledby="hero-title">
      <div class="field-line line-1" aria-hidden="true"></div>
      <div class="field-line line-2" aria-hidden="true"></div>
      <div class="field-line line-3" aria-hidden="true"></div>
      <div class="signal-path signal-a" aria-hidden="true"></div>
      <div class="signal-path signal-b" aria-hidden="true"></div>
      <div class="signal-path signal-c" aria-hidden="true"></div>

      <nav class="site-nav" aria-label="Primary navigation">
        <a href="#top" class="brand">Liam Krivacic</a>
        <div class="nav-links">
          <a href="#about">About</a>
          <a href="#projects">Projects</a>
          <a href="#contact">Contact</a>
        </div>
      </nav>

      <section class="hero-grid" id="top">
        <div class="hero-copy">
          <p class="eyebrow">Electrical Engineering + Computer Science</p>
          <h1 id="hero-title">Liam<br />Builds<br />Systems</h1>
          <p class="hero-summary">
            RF systems, infrastructure, robotics, and practical software
            presented as a field of connected project bodies.
          </p>
        </div>

        <section class="orbit-stage" aria-label="Interactive project orbit">
          <div class="orbit-ring ring-1" aria-hidden="true"></div>
          <div class="orbit-ring ring-2" aria-hidden="true"></div>
          <div class="orbit-ring ring-3" aria-hidden="true"></div>
          <div class="throw-trail" data-throw-trail aria-hidden="true"></div>
          <div class="blackhole" aria-hidden="true"></div>
          <div class="project-layer" data-project-layer></div>
        </section>
      </section>

      <section class="readout-panel" aria-live="polite" aria-label="Selected project details">
        <div class="readout-main">
          <span data-readout-kicker>Selected Orbit</span>
          <strong data-readout-title>RF Plasma</strong>
          <p data-readout-summary>
            High-power RF system design, waveguide simulation, impedance
            matching, measurement planning, and safety documentation.
          </p>
        </div>
        <div class="readout-meta">
          <span>Operating Mode</span>
          <strong data-readout-meta>AtomCraft / Team Lead</strong>
        </div>
      </section>

      <section class="content-band" id="about">
        <span>About</span>
        <p>
          This prototype focuses on the first-screen orbital interaction. Later
          sections stay simpler so the orbit remains the signature experience.
        </p>
      </section>
    </main>

    <script type="module" src="./app.mjs"></script>
  </body>
</html>
```

- [ ] **Step 3: Create the base visual stylesheet**

Create `design/plasma-orbital/styles.css` with this content:

```css
* {
  box-sizing: border-box;
}

:root {
  color-scheme: dark;
  --bg: #07090d;
  --panel: rgba(12, 16, 22, 0.78);
  --panel-strong: rgba(12, 16, 22, 0.9);
  --line: rgba(190, 204, 220, 0.16);
  --text: #f8f0df;
  --muted: #cbd5e1;
  --dim: #8ea0b4;
  --cyan: #67e8f9;
  --amber: #facc15;
  --pink: #fb7185;
  --green: #b9f6ca;
}

html {
  min-height: 100%;
  background: #05070a;
}

body {
  min-height: 100%;
  margin: 0;
  background: #05070a;
  color: var(--text);
  font-family:
    Inter, ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont,
    "Segoe UI", sans-serif;
}

a {
  color: inherit;
  text-decoration: none;
}

.orbital-page {
  position: relative;
  min-height: 100vh;
  overflow: hidden;
  padding: 24px clamp(18px, 4vw, 52px) 42px;
  background:
    radial-gradient(circle at 73% 30%, rgba(94, 234, 212, 0.16), transparent 25%),
    radial-gradient(circle at 22% 74%, rgba(251, 113, 133, 0.12), transparent 24%),
    radial-gradient(circle at 56% 55%, rgba(250, 204, 21, 0.07), transparent 28%),
    var(--bg);
  border: 1px solid #252c37;
  box-shadow:
    inset 0 1px 0 rgba(255, 255, 255, 0.08),
    0 28px 70px rgba(0, 0, 0, 0.38);
}

.orbital-page::before {
  content: "";
  position: absolute;
  inset: 0;
  background-image:
    linear-gradient(90deg, rgba(255, 255, 255, 0.028) 1px, transparent 1px),
    linear-gradient(0deg, rgba(255, 255, 255, 0.022) 1px, transparent 1px);
  background-size: 58px 58px;
  mask-image: radial-gradient(circle at 58% 50%, black, transparent 78%);
  opacity: 0.55;
  pointer-events: none;
}

.site-nav {
  position: relative;
  z-index: 10;
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 16px;
  color: #98a2b3;
  font-size: 12px;
  letter-spacing: 0.1em;
  text-transform: uppercase;
}

.brand {
  color: var(--text);
  font-weight: 800;
}

.nav-links {
  display: flex;
  gap: clamp(12px, 3vw, 28px);
}

.nav-links a:focus-visible,
.brand:focus-visible,
.project-orb:focus-visible {
  outline: 2px solid var(--cyan);
  outline-offset: 4px;
}

.hero-grid {
  position: relative;
  z-index: 3;
  display: grid;
  grid-template-columns: minmax(0, 0.95fr) minmax(360px, 1.05fr);
  gap: clamp(22px, 5vw, 54px);
  align-items: center;
  min-height: 68vh;
  padding-top: 38px;
}

.eyebrow,
.readout-panel span,
.content-band span {
  color: var(--cyan);
  font-family: ui-monospace, SFMono-Regular, Menlo, Consolas, monospace;
  font-size: 12px;
  letter-spacing: 0.12em;
  text-transform: uppercase;
}

.hero-copy h1 {
  margin: 18px 0 0;
  max-width: 660px;
  color: var(--text);
  font-size: clamp(64px, 8.2vw, 116px);
  font-weight: 950;
  letter-spacing: 0;
  line-height: 0.82;
  text-transform: uppercase;
}

.hero-summary {
  max-width: 520px;
  margin: 24px 0 0;
  color: var(--muted);
  font-size: 17px;
  line-height: 1.52;
}

.orbit-stage {
  position: relative;
  height: min(62vw, 560px);
  min-height: 440px;
}

.orbit-ring {
  position: absolute;
  left: 50%;
  top: 50%;
  border: 1px dashed rgba(248, 240, 223, 0.18);
  border-radius: 999px;
  transform: translate(-50%, -50%) rotate(-11deg);
}

.ring-1 {
  width: 48%;
  height: 32%;
}

.ring-2 {
  width: 69%;
  height: 49%;
  transform: translate(-50%, -50%) rotate(14deg);
}

.ring-3 {
  width: 87%;
  height: 64%;
  opacity: 0.72;
  transform: translate(-50%, -50%) rotate(-19deg);
}

.blackhole {
  position: absolute;
  left: 50%;
  top: 50%;
  width: clamp(112px, 13vw, 144px);
  height: clamp(112px, 13vw, 144px);
  border-radius: 999px;
  transform: translate(-50%, -50%);
  background: radial-gradient(
    circle at 50% 50%,
    #000 0 44%,
    rgba(0, 0, 0, 0.96) 48%,
    rgba(0, 0, 0, 0.7) 58%,
    transparent 66%
  );
  box-shadow:
    0 0 0 1px rgba(248, 240, 223, 0.16),
    0 0 42px rgba(0, 0, 0, 0.88),
    0 0 70px rgba(103, 232, 249, 0.16);
}

.blackhole::before {
  content: "";
  position: absolute;
  inset: -18px -34px;
  border-top: 2px solid rgba(103, 232, 249, 0.36);
  border-bottom: 1px solid rgba(251, 113, 133, 0.22);
  border-radius: 50%;
  filter: blur(0.2px);
  opacity: 0.78;
  transform: rotate(-14deg);
}

.project-layer {
  position: absolute;
  inset: 0;
}

.project-orb {
  position: absolute;
  z-index: 5;
  display: flex;
  align-items: center;
  gap: 8px;
  min-width: 122px;
  max-width: 152px;
  padding: 8px 11px 8px 8px;
  color: var(--muted);
  background: var(--panel-strong);
  border: 1px solid rgba(190, 204, 220, 0.18);
  border-radius: 999px;
  box-shadow:
    inset 0 1px 0 rgba(255, 255, 255, 0.07),
    0 14px 26px rgba(0, 0, 0, 0.22);
  cursor: grab;
  touch-action: none;
  user-select: none;
}

.project-orb:active,
.project-orb.is-dragging {
  cursor: grabbing;
}

.project-orb.is-selected {
  border-color: color-mix(in srgb, var(--orb-color) 72%, white 10%);
  box-shadow:
    inset 0 1px 0 rgba(255, 255, 255, 0.08),
    0 0 26px color-mix(in srgb, var(--orb-color) 32%, transparent),
    0 16px 28px rgba(0, 0, 0, 0.22);
}

.project-dot {
  flex: 0 0 auto;
  width: 18px;
  height: 18px;
  background: var(--orb-color);
  border-radius: 999px;
  box-shadow: 0 0 18px color-mix(in srgb, var(--orb-color) 58%, transparent);
}

.project-orb strong {
  display: block;
  color: var(--text);
  font-size: 12px;
  line-height: 1.05;
  white-space: nowrap;
}

.project-orb span {
  display: block;
  color: var(--dim);
  font-size: 9px;
  line-height: 1.05;
  letter-spacing: 0.08em;
  text-transform: uppercase;
  white-space: nowrap;
}

.throw-trail {
  position: absolute;
  z-index: 4;
  width: 190px;
  height: 1px;
  background: linear-gradient(90deg, rgba(103, 232, 249, 0.72), transparent);
  opacity: 0;
  pointer-events: none;
  transform-origin: left center;
  transition: opacity 240ms ease;
}

.throw-trail.is-visible {
  opacity: 0.48;
}

.field-line {
  position: absolute;
  left: -16%;
  right: -16%;
  height: 1px;
  background: linear-gradient(
    90deg,
    transparent,
    rgba(103, 232, 249, 0.68),
    rgba(250, 204, 21, 0.48),
    rgba(251, 113, 133, 0.58),
    transparent
  );
  opacity: 0.22;
  pointer-events: none;
}

.line-1 {
  top: 33%;
  transform: rotate(-7deg);
}

.line-2 {
  top: 53%;
  opacity: 0.18;
  transform: rotate(5deg);
}

.line-3 {
  top: 70%;
  opacity: 0.13;
  transform: rotate(-3deg);
}

.signal-path {
  position: absolute;
  z-index: 2;
  width: 760px;
  height: 2px;
  border-radius: 999px;
  opacity: 0;
  pointer-events: none;
  transform-origin: left center;
}

.signal-path::before {
  content: "";
  position: absolute;
  inset: 0;
  background: linear-gradient(
    90deg,
    transparent,
    rgba(103, 232, 249, 0.2),
    rgba(103, 232, 249, 0.9),
    rgba(248, 240, 223, 0.98)
  );
  border-radius: inherit;
  box-shadow: 0 0 14px rgba(103, 232, 249, 0.38);
}

.signal-path::after {
  content: "";
  position: absolute;
  right: -2px;
  top: -3px;
  width: 8px;
  height: 8px;
  background: var(--text);
  border-radius: 999px;
  box-shadow:
    0 0 16px rgba(248, 240, 223, 0.9),
    0 0 30px rgba(103, 232, 249, 0.45);
}

.signal-a {
  left: -140px;
  top: 28%;
  animation: signal-flash 7.5s infinite;
  transform: rotate(-13deg);
}

.signal-b {
  left: -160px;
  top: 61%;
  animation: signal-flash 11s infinite;
  animation-delay: -4s;
  transform: rotate(8deg);
}

.signal-b::before {
  background: linear-gradient(
    90deg,
    transparent,
    rgba(251, 113, 133, 0.18),
    rgba(251, 113, 133, 0.78),
    rgba(248, 240, 223, 0.95)
  );
  box-shadow: 0 0 14px rgba(251, 113, 133, 0.3);
}

.signal-c {
  left: -160px;
  top: 43%;
  animation: signal-flash 14s infinite;
  animation-delay: -8s;
  transform: rotate(-3deg);
}

@keyframes signal-flash {
  0%,
  82% {
    opacity: 0;
    clip-path: inset(0 100% 0 0);
  }

  84% {
    opacity: 0.95;
    clip-path: inset(0 0 0 0);
  }

  90% {
    opacity: 0.18;
    clip-path: inset(0 0 0 0);
  }

  94%,
  100% {
    opacity: 0;
    clip-path: inset(0 0 0 0);
  }
}

.readout-panel {
  position: relative;
  z-index: 6;
  display: grid;
  grid-template-columns: minmax(0, 1.2fr) minmax(240px, 0.8fr);
  gap: 10px;
  margin-top: 12px;
}

.readout-panel > div,
.content-band {
  padding: 14px;
  background: var(--panel);
  border: 1px solid rgba(190, 204, 220, 0.15);
  border-radius: 10px;
}

.readout-panel strong {
  display: block;
  margin-top: 8px;
  color: var(--text);
  font-size: 15px;
  line-height: 1.25;
}

.readout-panel p {
  margin: 10px 0 0;
  color: var(--muted);
  line-height: 1.5;
}

.content-band {
  position: relative;
  z-index: 4;
  max-width: 760px;
  margin-top: 18px;
}

.content-band p {
  margin: 10px 0 0;
  color: var(--muted);
  line-height: 1.5;
}

@media (max-width: 980px) {
  .hero-grid,
  .readout-panel {
    grid-template-columns: 1fr;
  }

  .orbit-stage {
    height: 440px;
    min-height: 420px;
  }

  .hero-copy h1 {
    font-size: 58px;
  }
}

@media (max-width: 620px) {
  .site-nav {
    align-items: flex-start;
    flex-direction: column;
  }

  .nav-links {
    width: 100%;
    justify-content: space-between;
  }

  .project-orb {
    min-width: 116px;
    transform: translate(-50%, -50%) scale(0.92);
  }
}

@media (prefers-reduced-motion: reduce) {
  *,
  *::before,
  *::after {
    animation-duration: 0.001ms !important;
    animation-iteration-count: 1 !important;
    scroll-behavior: auto !important;
  }

  .signal-path {
    display: none;
  }
}
```

- [ ] **Step 4: Verify the static page opens**

Run:

```powershell
Start-Process ".\design\plasma-orbital\index.html"
```

Expected: browser opens a dark orbital portfolio screen with hero text, a black-hole center, orbit rings, and no project capsules yet.

---

### Task 3: Render Capsules And Readout

**Files:**
- Create: `design/plasma-orbital/app.mjs`
- Modify: `design/plasma-orbital/index.html`

- [ ] **Step 1: Create the UI module with rendering and selection**

Create `design/plasma-orbital/app.mjs` with this content:

```js
import { projects } from "./projects.mjs";
import {
  beginDrag,
  createBody,
  moveDrag,
  releaseDrag,
  stepBody,
} from "./orbit-model.mjs";

const stage = document.querySelector(".orbit-stage");
const projectLayer = document.querySelector("[data-project-layer]");
const trail = document.querySelector("[data-throw-trail]");
const readoutKicker = document.querySelector("[data-readout-kicker]");
const readoutTitle = document.querySelector("[data-readout-title]");
const readoutSummary = document.querySelector("[data-readout-summary]");
const readoutMeta = document.querySelector("[data-readout-meta]");

let bodies = [];
let activeProjectId = projects[0].id;
let activePointerId = null;
let activeBodyId = null;
let lastPointer = null;
let lastPointerTime = 0;
let pointerVelocity = { x: 0, y: 0 };
let animationStart = performance.now();
let previousFrame = animationStart;

const capsuleById = new Map();

renderCapsules();
updateGeometry();
selectProject(activeProjectId);
requestAnimationFrame(animate);

window.addEventListener("resize", () => {
  updateGeometry();
  positionCapsules();
});

function renderCapsules() {
  const fragment = document.createDocumentFragment();

  for (const project of projects) {
    const button = document.createElement("button");
    button.className = "project-orb";
    button.type = "button";
    button.dataset.projectId = project.id;
    button.style.setProperty("--orb-color", project.color);
    button.innerHTML = `
      <span class="project-dot" aria-hidden="true"></span>
      <span>
        <strong>${project.name}</strong>
        <span>${project.category}</span>
      </span>
    `;

    button.addEventListener("click", () => selectProject(project.id));
    button.addEventListener("focus", () => selectProject(project.id));
    button.addEventListener("pointerdown", (event) => handlePointerDown(event, project.id));
    button.addEventListener("keydown", (event) => {
      if (event.key === "Enter" || event.key === " ") {
        event.preventDefault();
        selectProject(project.id);
      }
    });

    capsuleById.set(project.id, button);
    fragment.append(button);
  }

  projectLayer.append(fragment);
}

function updateGeometry() {
  const rect = stage.getBoundingClientRect();
  const centerX = rect.width / 2;
  const centerY = rect.height / 2;

  bodies = projects.map((project) => {
    const existing = bodies.find((body) => body.id === project.id);
    const next = createBody({
      id: project.id,
      orbitX: centerX,
      orbitY: centerY,
      radiusX: rect.width * project.radiusXRatio,
      radiusY: rect.height * project.radiusYRatio,
      angle: project.angle,
      speed: project.speed,
    });

    if (!existing) {
      return next;
    }

    return {
      ...next,
      x: existing.x,
      y: existing.y,
      vx: existing.vx,
      vy: existing.vy,
      mode: existing.mode,
      dragOffsetX: existing.dragOffsetX,
      dragOffsetY: existing.dragOffsetY,
    };
  });
}

function animate(now) {
  const elapsedSeconds = (now - animationStart) / 1000;
  const dtSeconds = Math.min((now - previousFrame) / 1000, 1 / 30);
  previousFrame = now;

  bodies = bodies.map((body) =>
    stepBody(body, {
      elapsedSeconds,
      dtSeconds,
    }),
  );

  positionCapsules();
  requestAnimationFrame(animate);
}

function positionCapsules() {
  for (const body of bodies) {
    const capsule = capsuleById.get(body.id);
    capsule.style.left = `${body.x}px`;
    capsule.style.top = `${body.y}px`;
    capsule.style.transform = "translate(-50%, -50%)";
    capsule.classList.toggle("is-dragging", body.mode === "drag");
  }
}

function selectProject(projectId) {
  const project = projects.find((item) => item.id === projectId);
  activeProjectId = projectId;

  for (const [id, capsule] of capsuleById) {
    capsule.classList.toggle("is-selected", id === projectId);
    capsule.setAttribute("aria-pressed", String(id === projectId));
  }

  readoutKicker.textContent = `${project.category} orbit`;
  readoutTitle.textContent = project.name;
  readoutSummary.textContent = project.summary;
  readoutMeta.textContent = project.meta;
}

function handlePointerDown(event, projectId) {
  if (!event.isPrimary) {
    return;
  }

  selectProject(projectId);
  activePointerId = event.pointerId;
  activeBodyId = projectId;
  lastPointer = localPointer(event);
  lastPointerTime = performance.now();
  pointerVelocity = { x: 0, y: 0 };

  bodies = bodies.map((body) =>
    body.id === projectId ? beginDrag(body, lastPointer) : body,
  );

  event.currentTarget.setPointerCapture(event.pointerId);
  event.currentTarget.addEventListener("pointermove", handlePointerMove);
  event.currentTarget.addEventListener("pointerup", handlePointerUp);
  event.currentTarget.addEventListener("pointercancel", handlePointerUp);
}

function handlePointerMove(event) {
  if (event.pointerId !== activePointerId || !activeBodyId) {
    return;
  }

  const now = performance.now();
  const pointer = localPointer(event);
  const dt = Math.max((now - lastPointerTime) / 1000, 1 / 120);

  pointerVelocity = {
    x: (pointer.x - lastPointer.x) / dt,
    y: (pointer.y - lastPointer.y) / dt,
  };

  bodies = bodies.map((body) =>
    body.id === activeBodyId ? moveDrag(body, pointer) : body,
  );

  lastPointer = pointer;
  lastPointerTime = now;
}

function handlePointerUp(event) {
  if (event.pointerId !== activePointerId || !activeBodyId) {
    return;
  }

  const releasedBody = bodies.find((body) => body.id === activeBodyId);

  bodies = bodies.map((body) =>
    body.id === activeBodyId ? releaseDrag(body, pointerVelocity) : body,
  );

  showThrowTrail(releasedBody, pointerVelocity);

  event.currentTarget.releasePointerCapture(event.pointerId);
  event.currentTarget.removeEventListener("pointermove", handlePointerMove);
  event.currentTarget.removeEventListener("pointerup", handlePointerUp);
  event.currentTarget.removeEventListener("pointercancel", handlePointerUp);

  activePointerId = null;
  activeBodyId = null;
  lastPointer = null;
}

function showThrowTrail(body, velocity) {
  const speed = Math.hypot(velocity.x, velocity.y);

  if (!body || speed < 80) {
    return;
  }

  const angle = Math.atan2(velocity.y, velocity.x);
  trail.style.left = `${body.x}px`;
  trail.style.top = `${body.y}px`;
  trail.style.transform = `rotate(${angle}rad)`;
  trail.classList.add("is-visible");

  window.setTimeout(() => {
    trail.classList.remove("is-visible");
  }, 650);
}

function localPointer(event) {
  const rect = stage.getBoundingClientRect();

  return {
    x: event.clientX - rect.left,
    y: event.clientY - rect.top,
  };
}
```

- [ ] **Step 2: Run the physics tests after adding UI code**

Run:

```powershell
node --test design/plasma-orbital/orbit-model.test.mjs
```

Expected: PASS with 4 passing tests.

- [ ] **Step 3: Open the prototype and verify capsule rendering**

Run:

```powershell
Start-Process ".\design\plasma-orbital\index.html"
```

Expected:

- Four compact project capsules appear around the black-hole field source.
- Focusing or clicking a capsule updates the lower readout.
- The selected capsule has a stronger border/glow.

---

### Task 4: Interaction And Motion Pass

**Files:**
- Modify: `design/plasma-orbital/app.mjs`
- Modify: `design/plasma-orbital/styles.css`

- [ ] **Step 1: Verify drag, throw, and return behavior manually**

Open:

```powershell
Start-Process ".\design\plasma-orbital\index.html"
```

Manual checks:

- Drag a capsule away from its orbit.
- Release it with a short throw.
- Confirm it drifts briefly and returns to orbit.
- Confirm the lower readout remains tied to the selected capsule.
- Confirm a throw trail appears only after a meaningful throw.

- [ ] **Step 2: If dragging feels too fast, tune only these constants**

Modify the `stepBody` call in `design/plasma-orbital/app.mjs` to this exact version:

```js
bodies = bodies.map((body) =>
  stepBody(body, {
    elapsedSeconds,
    dtSeconds,
    spring: 14,
    damping: 5.5,
  }),
);
```

Expected: capsules return more slowly and feel floatier.

- [ ] **Step 3: If dragging feels too loose, tune only these constants**

Modify the `stepBody` call in `design/plasma-orbital/app.mjs` to this exact version:

```js
bodies = bodies.map((body) =>
  stepBody(body, {
    elapsedSeconds,
    dtSeconds,
    spring: 24,
    damping: 7.5,
  }),
);
```

Expected: capsules return faster and feel more controlled.

- [ ] **Step 4: Keep the default tuning if both alternatives feel worse**

Ensure the `stepBody` call in `design/plasma-orbital/app.mjs` is this exact version:

```js
bodies = bodies.map((body) =>
  stepBody(body, {
    elapsedSeconds,
    dtSeconds,
  }),
);
```

Expected: the prototype uses the model defaults from `orbit-model.mjs`.

- [ ] **Step 5: Run tests after any tuning**

Run:

```powershell
node --test design/plasma-orbital/orbit-model.test.mjs
```

Expected: PASS with 4 passing tests.

---

### Task 5: Accessibility, Responsive, And Handoff Notes

**Files:**
- Create: `design/plasma-orbital/README.md`
- Modify: `design/plasma-orbital/styles.css`

- [ ] **Step 1: Add prototype README**

Create `design/plasma-orbital/README.md` with this content:

```md
# Plasma Orbital Prototype

Standalone prototype for Liam Krivacic's Plasma Field / Orbital Map portfolio direction.

## Open

Open `index.html` in a browser.

```powershell
Start-Process ".\design\plasma-orbital\index.html"
```

## Test

```powershell
node --test design/plasma-orbital/orbit-model.test.mjs
```

Expected result: 4 passing tests.

## Interaction Checklist

- Project capsules orbit a black-hole-like center.
- Clicking or focusing a capsule updates the lower readout.
- Dragging detaches a capsule from orbit.
- Releasing with movement throws the capsule.
- The capsule slowly returns to orbit.
- Fast signal traces appear infrequently and fade quickly.
- Reduced-motion mode removes signal animations.

## Design Notes

This prototype should stay close to the approved localhost mockup:

- Dark technical background.
- Large `Liam Builds Systems` hero type.
- Compact project capsules.
- Black-hole field source, not Liam's name in the center.
- Rare fast light trails.
- No strong constant cursor glow.
```

- [ ] **Step 2: Verify responsive layout**

Open the prototype and resize the browser to these widths:

- 1280px desktop.
- 900px tablet.
- 390px mobile.

Expected:

- Desktop shows hero left and orbit right.
- Tablet stacks cleanly without overlap.
- Mobile shows nav, hero, orbit, and readout in a readable order.

- [ ] **Step 3: Verify keyboard access**

Use Tab, Enter, and Space in the browser.

Expected:

- Navigation links receive visible focus.
- Project capsules receive visible focus.
- Focusing a project capsule updates the readout.
- Enter or Space on a focused project capsule keeps that project selected.

- [ ] **Step 4: Verify reduced motion**

Temporarily add this class to the `<body>` tag in `design/plasma-orbital/index.html`:

```html
<body class="debug-reduced-motion">
```

Then append this CSS to `design/plasma-orbital/styles.css`:

```css
.debug-reduced-motion .signal-path {
  display: none;
}

.debug-reduced-motion .project-orb {
  transition: none;
}
```

Expected:

- Signal traces are hidden.
- Prototype remains readable and navigable.

Remove the `debug-reduced-motion` class from `<body>` after the check so the file returns to:

```html
<body>
```

- [ ] **Step 5: Final verification**

Run:

```powershell
node --test design/plasma-orbital/orbit-model.test.mjs
```

Expected: PASS with 4 passing tests.

Open:

```powershell
Start-Process ".\design\plasma-orbital\index.html"
```

Expected: the prototype visually matches the approved Orbital Map / black-hole / fast-signal direction and is ready for user review.

---

## Self-Review

- Spec coverage: Tasks cover the standalone prototype, black-hole center, compact orbiting capsules, selected project readout, grab/throw/return physics, fast fading signal traces, responsive layout, keyboard focus, and reduced-motion behavior.
- Vague-text scan: Plan defines exact file paths, commands, and code blocks for each implementation step.
- Type consistency: `projects.mjs`, `orbit-model.mjs`, `orbit-model.test.mjs`, and `app.mjs` use matching ids, property names, and function signatures.
