import { describe, expect, it } from "vitest";

import {
  beginDrag,
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
});
