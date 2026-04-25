import { describe, expect, it } from "vitest";

import {
  beginDrag,
  cursorFieldOffset,
  createBody,
  moveDrag,
  orbitPosition,
  releaseDrag,
  stepBody,
} from "@/lib/orbit-model";

describe("orbit model", () => {
  it("returns the expected ellipse point", () => {
    const body = createBody({
      id: "rf-plasma",
      orbitX: 200,
      orbitY: 100,
      radiusX: 80,
      radiusY: 40,
      angle: 0,
      speed: 0,
    });

    expect(orbitPosition(body, 0)).toEqual({ x: 280, y: 100 });
  });

  it("preserves pointer offset while dragging", () => {
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

    expect(moved.mode).toBe("drag");
    expect(moved.x).toBe(320);
    expect(moved.y).toBe(140);
  });

  it("caps throw velocity so capsules cannot fly away", () => {
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

    expect(released.mode).toBe("return");
    expect(released.vx).toBe(1400);
    expect(released.vy).toBe(-1400);
  });

  it("pulls a released body back toward its orbit target", () => {
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
      mode: "return" as const,
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

    expect(next.mode).toBe("return");
    expect(next.x).toBeGreaterThan(body.x);
    expect(next.vx).toBeGreaterThan(0);
  });

  it("creates a subtle nearby cursor field offset without changing distant capsules", () => {
    const body = createBody({
      id: "rf-plasma",
      orbitX: 200,
      orbitY: 100,
      radiusX: 80,
      radiusY: 40,
      angle: 0,
      speed: 0,
    });

    const nearby = cursorFieldOffset(body, { x: 250, y: 120 }, { radius: 120, strength: 16 });
    const distant = cursorFieldOffset(body, { x: -500, y: -500 }, { radius: 120, strength: 16 });

    expect(nearby.x).toBeGreaterThan(0);
    expect(nearby.y).toBeLessThan(0);
    expect(Math.hypot(nearby.x, nearby.y)).toBeLessThanOrEqual(16);
    expect(distant).toEqual({ x: 0, y: 0 });
  });
});
