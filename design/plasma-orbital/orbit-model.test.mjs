import test from "node:test";
import assert from "node:assert/strict";

import {
  beginDrag,
  createBody,
  moveDrag,
  orbitPosition,
  releaseDrag,
  stepBody,
} from "./orbit-model.js";

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
