# Black Hole Light Sink Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace the current procedural line-based black-hole field with a warm canvas light-sink effect where cursor-emitted particles curve inward and are absorbed.

**Architecture:** Keep `FieldCanvas` as the single canvas layer behind the hero UI. Add a small pure model for cursor-emitted light particles so the attraction and absorption behavior is testable, then rewrite the renderer around broad halo gradients, translucent ribbons, and particle trails. Remove old decorative cursor spotlight and straight signal traces from the hero markup/CSS so the new effect is visually coherent.

**Tech Stack:** Next.js 16.2.4, React 19, TypeScript, Canvas 2D, Tailwind CSS 3, Vitest 4.

---

## File Structure

- Modify `vitest.config.mts`: scope Vitest to app tests so `npm test` does not try to run the standalone `node:test` prototype test.
- Create `src/lib/light-sink-model.ts`: pure particle creation, attraction, absorption, alpha, and pointer emission helpers.
- Create `src/lib/light-sink-model.test.ts`: Vitest coverage for the light-sink particle model.
- Modify `src/components/orbital/field-canvas.tsx`: replace star/strand renderer with halo, ribbon, and captured-light particle renderer.
- Modify `src/components/orbital/orbital-hero.tsx`: remove old cursor-lens and straight signal trace markup/state.
- Modify `src/app/globals.css`: remove old `.cursor-lens`/`.signal-path` styles and tune `.blackhole`/canvas layering for the new effect.

## Task 1: Scope Vitest To App Tests

**Files:**
- Modify: `vitest.config.mts`

- [ ] **Step 1: Reproduce the current root test failure**

Run:

```powershell
npm test
```

Expected: FAIL because Vitest discovers `design/plasma-orbital/orbit-model.test.mjs`, which uses Node's built-in test runner and reports `No test suite found`.

- [ ] **Step 2: Update Vitest config**

Replace `vitest.config.mts` with:

```ts
import { fileURLToPath } from "node:url";
import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    environment: "node",
    include: ["src/**/*.test.ts", "src/**/*.test.tsx"],
  },
  resolve: {
    alias: {
      "@": fileURLToPath(new URL("./src", import.meta.url)),
    },
  },
});
```

- [ ] **Step 3: Verify root tests pass**

Run:

```powershell
npm test
```

Expected: PASS with the existing app test files only.

- [ ] **Step 4: Verify standalone prototype tests still pass with their intended runner**

Run:

```powershell
node --test design\plasma-orbital\orbit-model.test.mjs
```

Expected: PASS with 4 tests.

- [ ] **Step 5: Commit**

Run:

```powershell
git add vitest.config.mts
git commit -m "test: scope vitest to app tests"
```

## Task 2: Add Tested Light-Sink Particle Model

**Files:**
- Create: `src/lib/light-sink-model.ts`
- Create: `src/lib/light-sink-model.test.ts`

- [ ] **Step 1: Write the failing model tests**

Create `src/lib/light-sink-model.test.ts`:

```ts
import { describe, expect, it } from "vitest";

import {
  createLightParticle,
  particleAlpha,
  shouldEmitLight,
  stepLightParticle,
} from "@/lib/light-sink-model";

describe("light sink model", () => {
  it("creates cursor light with velocity toward the black hole and a curved tangent", () => {
    const particle = createLightParticle({
      id: 2,
      origin: { x: 100, y: 100 },
      target: { x: 300, y: 100 },
    });

    expect(particle.x).toBe(100);
    expect(particle.y).toBe(100);
    expect(particle.vx).toBeGreaterThan(0);
    expect(Math.abs(particle.vy)).toBeGreaterThan(1);
    expect(particle.lifetimeSeconds).toBeGreaterThanOrEqual(1);
    expect(particle.lifetimeSeconds).toBeLessThanOrEqual(2.5);
  });

  it("pulls particles closer to the black hole over time", () => {
    const target = { x: 300, y: 100 };
    const particle = createLightParticle({
      id: 1,
      origin: { x: 100, y: 100 },
      target,
    });

    const before = Math.hypot(target.x - particle.x, target.y - particle.y);
    const next = stepLightParticle(particle, {
      target,
      dtSeconds: 1 / 30,
      horizonRadius: 70,
    });
    const after = Math.hypot(target.x - next.x, target.y - next.y);

    expect(after).toBeLessThan(before);
    expect(next.previousX).toBe(particle.x);
    expect(next.previousY).toBe(particle.y);
  });

  it("marks particles absorbed inside the event horizon", () => {
    const particle = createLightParticle({
      id: 4,
      origin: { x: 290, y: 100 },
      target: { x: 300, y: 100 },
    });

    const next = stepLightParticle(particle, {
      target: { x: 300, y: 100 },
      dtSeconds: 1 / 60,
      horizonRadius: 70,
    });

    expect(next.absorbed).toBe(true);
  });

  it("fades particles in and out across their lifetime", () => {
    const particle = createLightParticle({
      id: 3,
      origin: { x: 100, y: 100 },
      target: { x: 300, y: 100 },
    });

    expect(particleAlpha({ ...particle, ageSeconds: 0 })).toBe(0);
    expect(particleAlpha({ ...particle, ageSeconds: particle.lifetimeSeconds / 2 })).toBeGreaterThan(0.65);
    expect(particleAlpha({ ...particle, ageSeconds: particle.lifetimeSeconds })).toBe(0);
  });

  it("emits only after the pointer moves far enough", () => {
    expect(shouldEmitLight(null, { x: 10, y: 10 })).toBe(true);
    expect(shouldEmitLight({ x: 10, y: 10 }, { x: 13, y: 13 })).toBe(false);
    expect(shouldEmitLight({ x: 10, y: 10 }, { x: 24, y: 10 })).toBe(true);
  });
});
```

- [ ] **Step 2: Run the failing model tests**

Run:

```powershell
npm test -- src/lib/light-sink-model.test.ts
```

Expected: FAIL with a module-not-found error for `@/lib/light-sink-model`.

- [ ] **Step 3: Implement the model**

Create `src/lib/light-sink-model.ts`:

```ts
export type LightPoint = {
  x: number;
  y: number;
};

export type LightParticle = {
  id: number;
  x: number;
  y: number;
  previousX: number;
  previousY: number;
  vx: number;
  vy: number;
  ageSeconds: number;
  lifetimeSeconds: number;
  size: number;
  spin: number;
  warmth: number;
  absorbed: boolean;
};

type CreateLightParticleOptions = {
  id: number;
  origin: LightPoint;
  target: LightPoint;
};

type StepLightParticleOptions = {
  target: LightPoint;
  dtSeconds: number;
  horizonRadius: number;
};

export function createLightParticle({
  id,
  origin,
  target,
}: CreateLightParticleOptions): LightParticle {
  const dx = target.x - origin.x;
  const dy = target.y - origin.y;
  const distance = Math.max(Math.hypot(dx, dy), 1);
  const directionX = dx / distance;
  const directionY = dy / distance;
  const spin = id % 2 === 0 ? 1 : -1;
  const tangentX = -directionY * spin;
  const tangentY = directionX * spin;
  const pullSpeed = clamp(distance * 0.42, 90, 340);
  const tangentSpeed = 72 + pseudoRandom(id * 17) * 68;

  return {
    id,
    x: origin.x,
    y: origin.y,
    previousX: origin.x,
    previousY: origin.y,
    vx: directionX * pullSpeed + tangentX * tangentSpeed,
    vy: directionY * pullSpeed + tangentY * tangentSpeed,
    ageSeconds: 0,
    lifetimeSeconds: 1 + pseudoRandom(id * 29) * 1.5,
    size: 1.8 + pseudoRandom(id * 43) * 3.8,
    spin,
    warmth: pseudoRandom(id * 61),
    absorbed: false,
  };
}

export function stepLightParticle(
  particle: LightParticle,
  { target, dtSeconds, horizonRadius }: StepLightParticleOptions,
): LightParticle {
  if (particle.absorbed) {
    return particle;
  }

  const dx = target.x - particle.x;
  const dy = target.y - particle.y;
  const distance = Math.max(Math.hypot(dx, dy), 1);
  const directionX = dx / distance;
  const directionY = dy / distance;
  const tangentX = -directionY * particle.spin;
  const tangentY = directionX * particle.spin;
  const pull = clamp(96000 / (distance * distance + 1200), 80, 760);
  const curve = clamp(2600 / (distance + 40), 8, 96);
  const drag = Math.exp(-0.72 * dtSeconds);
  const vx = (particle.vx + (directionX * pull + tangentX * curve) * dtSeconds) * drag;
  const vy = (particle.vy + (directionY * pull + tangentY * curve) * dtSeconds) * drag;
  const x = particle.x + vx * dtSeconds;
  const y = particle.y + vy * dtSeconds;
  const ageSeconds = particle.ageSeconds + dtSeconds;
  const nextDistance = Math.hypot(target.x - x, target.y - y);

  return {
    ...particle,
    previousX: particle.x,
    previousY: particle.y,
    x,
    y,
    vx,
    vy,
    ageSeconds,
    absorbed: nextDistance < horizonRadius * 0.72 || ageSeconds >= particle.lifetimeSeconds,
  };
}

export function particleAlpha(particle: Pick<LightParticle, "ageSeconds" | "lifetimeSeconds">) {
  const progress = clamp(particle.ageSeconds / particle.lifetimeSeconds, 0, 1);
  const fadeIn = smoothstep(clamp(progress / 0.14, 0, 1));
  const fadeOut = smoothstep(clamp((1 - progress) / 0.24, 0, 1));

  return Number((fadeIn * fadeOut).toFixed(4));
}

export function shouldEmitLight(previous: LightPoint | null, current: LightPoint, threshold = 8) {
  if (!previous) {
    return true;
  }

  return Math.hypot(current.x - previous.x, current.y - previous.y) >= threshold;
}

function smoothstep(value: number) {
  return value * value * (3 - 2 * value);
}

function clamp(value: number, min: number, max: number) {
  return Math.min(Math.max(value, min), max);
}

function pseudoRandom(seed: number) {
  const value = Math.sin(seed * 12.9898) * 43758.5453;

  return value - Math.floor(value);
}
```

- [ ] **Step 4: Verify model tests pass**

Run:

```powershell
npm test -- src/lib/light-sink-model.test.ts
```

Expected: PASS with 5 tests.

- [ ] **Step 5: Commit**

Run:

```powershell
git add src/lib/light-sink-model.ts src/lib/light-sink-model.test.ts
git commit -m "feat: add light sink particle model"
```

## Task 3: Replace FieldCanvas With Light-Sink Renderer

**Files:**
- Modify: `src/components/orbital/field-canvas.tsx`

- [ ] **Step 1: Add the model imports and replace local types**

After the existing `Point` import in `src/components/orbital/field-canvas.tsx`, add:

```ts
import {
  createLightParticle,
  particleAlpha,
  shouldEmitLight,
  stepLightParticle,
  type LightParticle,
} from "@/lib/light-sink-model";
```

Replace the current type declarations for `FieldPoint`, `Star`, and `StrandTone` with:

```ts

type RibbonPoint = Point & {
  alpha: number;
};

type RibbonTone = "deep" | "amber" | "gold" | "white";
```

Keep `FieldCanvasProps` unchanged.

- [ ] **Step 2: Replace old star/strand state with particle state**

Inside the `useEffect`, replace:

```ts
let startTime = performance.now();
const stars = createStarField();
```

with:

```ts
let startTime = performance.now();
let particles: LightParticle[] = [];
let nextParticleId = 1;
let lastEmissionPoint: Point | null = null;
```

- [ ] **Step 3: Replace the old drawing helpers**

Delete these functions from inside the effect:

```ts
applyCursorWake
projectOrbitalPoint
drawPhotonStrand
drawAccretionDisk
drawStars
drawGravityGlow
```

Add these functions inside the effect after `eventHorizon`:

```ts
const projectRibbonPoint = (
  center: Point,
  angle: number,
  radius: number,
  laneOffset: number,
): Point => {
  const perspectiveX = width < 620 ? 1.3 : 1.86;
  const perspectiveY = width < 620 ? 0.54 : 0.48;
  const rotation = -0.1;
  const localX = Math.cos(angle) * radius * perspectiveX;
  const localY = Math.sin(angle) * radius * perspectiveY + laneOffset;
  const cos = Math.cos(rotation);
  const sin = Math.sin(rotation);

  return {
    x: center.x + localX * cos - localY * sin,
    y: center.y + localX * sin + localY * cos,
  };
};

const drawBackdrop = (center: Point) => {
  const backdrop = context.createRadialGradient(center.x, center.y, 60, center.x, center.y, 620);
  backdrop.addColorStop(0, "rgba(0, 0, 0, 0.62)");
  backdrop.addColorStop(0.22, "rgba(84, 39, 4, 0.2)");
  backdrop.addColorStop(0.54, "rgba(79, 31, 0, 0.08)");
  backdrop.addColorStop(1, "rgba(0, 0, 0, 0)");
  context.fillStyle = backdrop;
  context.fillRect(0, 0, width, height);
};

const drawHalo = (center: Point, elapsed: number) => {
  const horizon = eventHorizon();
  const pulse = reducedMotionRef.current ? 0 : Math.sin(elapsed * 0.9) * 0.035;
  const glow = context.createRadialGradient(
    center.x,
    center.y,
    horizon * 0.92,
    center.x,
    center.y,
    horizon * 5.7,
  );
  glow.addColorStop(0, "rgba(0, 0, 0, 0)");
  glow.addColorStop(0.13, `rgba(255, 235, 176, ${0.24 + pulse})`);
  glow.addColorStop(0.22, `rgba(255, 183, 73, ${0.28 + pulse})`);
  glow.addColorStop(0.42, "rgba(216, 91, 14, 0.13)");
  glow.addColorStop(0.76, "rgba(113, 42, 2, 0.05)");
  glow.addColorStop(1, "rgba(0, 0, 0, 0)");

  context.save();
  context.globalCompositeOperation = "lighter";
  context.fillStyle = glow;
  context.fillRect(0, 0, width, height);
  context.restore();
};

const drawRibbon = (
  center: Point,
  elapsed: number,
  lane: number,
  tone: RibbonTone,
  options: { radius: number; width: number; alpha: number; speed: number; offset: number },
) => {
  const points: RibbonPoint[] = [];
  const steps = width < 620 ? 64 : 92;
  const sweep = Math.PI * (1.18 + Math.abs(lane) * 0.24);
  const start =
    -Math.PI * 0.16 +
    options.offset +
    (reducedMotionRef.current ? 0 : elapsed * options.speed);

  for (let step = 0; step <= steps; step += 1) {
    const t = step / steps;
    const eased = smoothstep(t);
    const edgeFade = smoothstep(Math.min(1, t / 0.18)) * smoothstep(Math.min(1, (1 - t) / 0.22));
    const pinch = Math.sin(t * Math.PI) * options.radius * 0.16;
    const angle = start + sweep * eased;
    const radius =
      options.radius -
      pinch +
      Math.sin(elapsed * 0.18 + lane * 5 + t * Math.PI * 2) * (width < 620 ? 2 : 5);

    points.push({
      ...projectRibbonPoint(center, angle, radius, lane * (width < 620 ? 28 : 46)),
      alpha: options.alpha * edgeFade,
    });
  }

  strokeRibbon(context, points, tone, options.width);
};

const drawRibbons = (center: Point, elapsed: number) => {
  const horizon = eventHorizon();

  drawRibbon(center, elapsed, -0.55, "deep", {
    radius: horizon + (width < 620 ? 68 : 132),
    width: width < 620 ? 18 : 28,
    alpha: 0.1,
    speed: 0.035,
    offset: -0.32,
  });
  drawRibbon(center, elapsed, -0.24, "amber", {
    radius: horizon + (width < 620 ? 46 : 86),
    width: width < 620 ? 13 : 20,
    alpha: 0.22,
    speed: 0.046,
    offset: 0.08,
  });
  drawRibbon(center, elapsed, 0.08, "gold", {
    radius: horizon + (width < 620 ? 34 : 58),
    width: width < 620 ? 7 : 11,
    alpha: 0.34,
    speed: 0.06,
    offset: 0.2,
  });
  drawRibbon(center, elapsed, 0.32, "white", {
    radius: horizon + (width < 620 ? 24 : 42),
    width: width < 620 ? 2.3 : 3.4,
    alpha: 0.54,
    speed: 0.072,
    offset: 0.42,
  });
};

const emitCursorLight = (point: Point, target: Point) => {
  if (reducedMotionRef.current || !shouldEmitLight(lastEmissionPoint, point)) {
    return;
  }

  const count = width < 620 ? 2 : 3;

  for (let index = 0; index < count; index += 1) {
    const id = nextParticleId;
    const jitter = (pseudoRandom(id * 19) - 0.5) * 18;
    const spread = (pseudoRandom(id * 31) - 0.5) * 18;
    particles.push(
      createLightParticle({
        id,
        origin: {
          x: point.x + jitter,
          y: point.y + spread,
        },
        target,
      }),
    );
    nextParticleId += 1;
  }

  particles = particles.slice(-130);
  lastEmissionPoint = point;
};

const updateParticles = (center: Point, dtSeconds: number) => {
  if (reducedMotionRef.current) {
    particles = [];
    return;
  }

  particles = particles
    .map((particle) =>
      stepLightParticle(particle, {
        target: center,
        dtSeconds,
        horizonRadius: eventHorizon(),
      }),
    )
    .filter((particle) => !particle.absorbed);
};

const drawParticles = (center: Point) => {
  const horizon = eventHorizon();

  context.save();
  context.globalCompositeOperation = "lighter";
  context.lineCap = "round";

  for (const particle of particles) {
    const alpha = particleAlpha(particle);
    const distance = Math.hypot(center.x - particle.x, center.y - particle.y);
    const rimBoost = smoothstep(Math.max(0, 1 - (distance - horizon) / (horizon * 2.8)));
    const warmth = 180 + Math.round(particle.warmth * 42);
    const baseAlpha = Math.min(0.92, alpha * (0.42 + rimBoost * 0.58));
    const color = `rgba(255, ${warmth}, ${80 + Math.round(particle.warmth * 36)}, ${baseAlpha})`;

    context.beginPath();
    context.strokeStyle = color;
    context.lineWidth = particle.size * (1.2 + rimBoost * 1.2);
    context.shadowColor = color;
    context.shadowBlur = 16 + rimBoost * 22;
    context.moveTo(particle.previousX, particle.previousY);
    context.lineTo(particle.x, particle.y);
    context.stroke();

    context.beginPath();
    context.fillStyle = color;
    context.arc(particle.x, particle.y, particle.size * (0.7 + rimBoost * 0.6), 0, Math.PI * 2);
    context.fill();
  }

  context.restore();
};
```

- [ ] **Step 4: Replace the draw loop body**

In `draw`, replace everything after:

```ts
const elapsed = reducedMotionRef.current ? 0 : (now - startTime) / 1000;
const center = blackHoleCenter();
```

with:

```ts
const dtSeconds = Math.min((now - previousDrawTime) / 1000, 1 / 30);
previousDrawTime = now;

context.clearRect(0, 0, width, height);
context.globalCompositeOperation = "source-over";

drawBackdrop(center);
drawHalo(center, elapsed);
drawRibbons(center, elapsed);

const cursor = pointerRef.current;
if (cursor) {
  emitCursorLight(cursor, center);
}

updateParticles(center, dtSeconds);
drawParticles(center);

context.globalCompositeOperation = "source-over";

if (!reducedMotionRef.current) {
  frameId = requestAnimationFrame(draw);
}
```

Add this variable near `startTime`:

```ts
let previousDrawTime = startTime;
```

- [ ] **Step 5: Replace pointer leave behavior**

Replace:

```ts
const handlePointerLeave = () => {
  pointerRef.current = null;
};
```

with:

```ts
const handlePointerLeave = () => {
  pointerRef.current = null;
  lastEmissionPoint = null;
};
```

- [ ] **Step 6: Replace file-level helper functions**

Delete `strokeStrand`, `strandColor`, and `createStarField`.

Delete `lerp` because the replacement renderer no longer uses it.

Add these file-level helpers after the component:

```ts
function strokeRibbon(
  context: CanvasRenderingContext2D,
  points: RibbonPoint[],
  tone: RibbonTone,
  width: number,
) {
  if (points.length < 2) {
    return;
  }

  context.save();
  context.lineCap = "round";
  context.lineJoin = "round";

  for (let index = 0; index < points.length - 1; index += 1) {
    const current = points[index];
    const next = points[index + 1];
    const alpha = (current.alpha + next.alpha) / 2;

    if (alpha < 0.01) {
      continue;
    }

    const color = ribbonColor(tone, alpha);
    context.beginPath();
    context.moveTo(current.x, current.y);
    context.quadraticCurveTo(current.x, current.y, next.x, next.y);
    context.strokeStyle = color;
    context.lineWidth = width;
    context.shadowColor = color;
    context.shadowBlur = tone === "white" ? 24 : tone === "gold" ? 30 : 42;
    context.stroke();
  }

  context.restore();
}

function ribbonColor(tone: RibbonTone, alpha: number) {
  if (tone === "white") {
    return `rgba(255, 244, 205, ${alpha})`;
  }

  if (tone === "gold") {
    return `rgba(255, 203, 96, ${alpha})`;
  }

  if (tone === "amber") {
    return `rgba(239, 132, 29, ${alpha})`;
  }

  return `rgba(151, 68, 12, ${alpha})`;
}

function smoothstep(value: number) {
  const clamped = Math.min(Math.max(value, 0), 1);

  return clamped * clamped * (3 - 2 * clamped);
}

function pseudoRandom(seed: number) {
  const value = Math.sin(seed * 12.9898) * 43758.5453;

  return value - Math.floor(value);
}
```

- [ ] **Step 7: Verify focused tests and lint**

Run:

```powershell
npm test -- src/lib/light-sink-model.test.ts
npm run lint
```

Expected: both commands pass.

- [ ] **Step 8: Commit**

Run:

```powershell
git add src/components/orbital/field-canvas.tsx
git commit -m "feat: render black hole light sink canvas"
```

## Task 4: Remove Old Cursor Lens And Signal Traces

**Files:**
- Modify: `src/components/orbital/orbital-hero.tsx`
- Modify: `src/app/globals.css`

- [ ] **Step 1: Remove page-level cursor handlers from `OrbitalHero`**

Delete these callbacks from `src/components/orbital/orbital-hero.tsx`:

```ts
const handlePagePointerMove = useCallback((event: ReactPointerEvent<HTMLElement>) => {
  const page = pageRef.current;

  if (!page || reducedMotionRef.current) {
    return;
  }

  const rect = page.getBoundingClientRect();
  page.style.setProperty("--cursor-x", `${event.clientX - rect.left}px`);
  page.style.setProperty("--cursor-y", `${event.clientY - rect.top}px`);
  page.style.setProperty("--cursor-energy", "1");
}, []);

const handlePagePointerLeave = useCallback(() => {
  pageRef.current?.style.setProperty("--cursor-energy", "0");
}, []);
```

- [ ] **Step 2: Remove old markup**

Replace the opening `<main>` in `OrbitalHero`:

```tsx
<main
  ref={pageRef}
  className="orbital-page"
  aria-labelledby="hero-title"
  onPointerMove={handlePagePointerMove}
  onPointerLeave={handlePagePointerLeave}
>
```

with:

```tsx
<main ref={pageRef} className="orbital-page" aria-labelledby="hero-title">
```

Delete these elements below `<FieldCanvas />`:

```tsx
<div className="cursor-lens" aria-hidden="true" />
<div className="signal-path signal-a" aria-hidden="true" />
<div className="signal-path signal-b" aria-hidden="true" />
<div className="signal-path signal-c" aria-hidden="true" />
```

- [ ] **Step 3: Remove stale CSS**

In `src/app/globals.css`, replace:

```css
.field-canvas,
.cursor-lens,
.signal-path {
  position: absolute;
  pointer-events: none;
}
```

with:

```css
.field-canvas {
  position: absolute;
  pointer-events: none;
}
```

Delete the full `.cursor-lens` block, every `.signal-path` block, `.signal-a`, `.signal-b`, `.signal-c`, and `@keyframes signal-flash`.

- [ ] **Step 4: Tune the DOM event horizon to support the canvas halo**

In `src/app/globals.css`, replace the `.blackhole` block with:

```css
.blackhole {
  position: absolute;
  left: 50%;
  top: 50%;
  z-index: 3;
  width: 138px;
  height: 138px;
  border-radius: 999px;
  transform: translate(-50%, -50%);
  background: radial-gradient(circle at 50% 50%, #010100 0 56%, rgba(0, 0, 0, 0.98) 62%, rgba(0, 0, 0, 0.58) 72%, transparent 78%);
  box-shadow:
    0 0 0 1px rgba(255, 230, 176, 0.18),
    0 0 44px rgba(0, 0, 0, 0.96),
    0 0 78px rgba(255, 158, 24, 0.28);
}
```

Keep the existing mobile width/height override for `.blackhole`.

- [ ] **Step 5: Verify app tests and lint**

Run:

```powershell
npm test
npm run lint
```

Expected: both commands pass.

- [ ] **Step 6: Commit**

Run:

```powershell
git add src/components/orbital/orbital-hero.tsx src/app/globals.css
git commit -m "refactor: remove old cursor field traces"
```

## Task 5: Full Verification And Local Visual Check

**Files:**
- No planned file edits.

- [ ] **Step 1: Run all automated verification**

Run:

```powershell
npm test
npm run lint
npm run build
```

Expected: all commands pass.

- [ ] **Step 2: Start the dev server**

Run:

```powershell
npm run dev
```

Expected: Next.js starts successfully and prints a local URL, normally `http://localhost:3000`.

- [ ] **Step 3: Manual desktop check**

Open the local URL on a desktop-width viewport.

Expected:

- The idle black hole has a clean dark center and warm smooth corona.
- Broad translucent amber ribbons replace the old dense line field.
- Moving the cursor emits small light particles that curve inward and disappear near the event horizon.
- Hero text remains readable on the left.
- Project capsules remain visible, selectable, draggable, and throwable.

- [ ] **Step 4: Manual mobile check**

Resize to roughly 390px wide.

Expected:

- The hero still fits inside the viewport.
- The event horizon and capsules remain visible.
- Cursor particle behavior is not required on touch-only mobile, but the static halo must remain readable.
- Readout text does not overlap the orbital stage.

- [ ] **Step 5: Reduced-motion check**

Temporarily enable reduced motion in the browser or OS accessibility settings and reload the local page.

Expected:

- The halo renders as a static warm light sink.
- Cursor-emitted particles do not spawn.
- Project capsules still render and remain usable.

- [ ] **Step 6: Final commit if verification caused small tuning changes**

If any tuning changes were made during visual checks, run:

```powershell
npm test
npm run lint
npm run build
git add src/components/orbital/field-canvas.tsx src/components/orbital/orbital-hero.tsx src/app/globals.css
git commit -m "fix: tune black hole light sink visuals"
```

Expected: commit is created only if files changed during verification.

## Self-Review

- Spec coverage: The plan replaces dense procedural streamlines, keeps a warm amber event horizon, adds cursor-emitted captured particles, preserves project capsule behavior, handles reduced motion, and avoids new dependencies.
- Placeholder scan: The plan contains exact paths, commands, expected outcomes, and concrete code snippets for each code change.
- Type consistency: `LightPoint`, `LightParticle`, `createLightParticle`, `stepLightParticle`, `particleAlpha`, and `shouldEmitLight` are defined in Task 2 and used with matching names in Task 3.
