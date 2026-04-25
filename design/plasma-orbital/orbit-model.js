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
    // Preserve where the user grabbed the capsule so it does not jump to the cursor center.
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

  // Released capsules behave like charged bodies being pulled back into a stable orbit.
  const ax = (target.x - body.x) * spring;
  const ay = (target.y - body.y) * spring;
  const decay = Math.exp(-damping * dtSeconds);
  const vx = (body.vx + ax * dtSeconds) * decay;
  const vy = (body.vy + ay * dtSeconds) * decay;
  const x = body.x + vx * dtSeconds;
  const y = body.y + vy * dtSeconds;

  const distance = Math.hypot(target.x - x, target.y - y);
  const speed = Math.hypot(vx, vy);

  // Once the body is visually back on track, hand it back to the orbital loop.
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
