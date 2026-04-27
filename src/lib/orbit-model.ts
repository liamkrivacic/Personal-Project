const MAX_THROW_VELOCITY = 1400;

export type Point = {
  x: number;
  y: number;
};

export type BodyMode = "orbit" | "drag" | "return";

export type OrbitBody = {
  id: string;
  orbitX: number;
  orbitY: number;
  radiusX: number;
  radiusY: number;
  angle: number;
  speed: number;
  x: number;
  y: number;
  vx: number;
  vy: number;
  mode: BodyMode;
  dragOffsetX: number;
  dragOffsetY: number;
};

export type BodyConfig = Pick<
  OrbitBody,
  "id" | "orbitX" | "orbitY" | "radiusX" | "radiusY" | "angle" | "speed"
>;

export function createBody(config: BodyConfig): OrbitBody {
  const position = orbitPosition(config, 0);

  return {
    ...config,
    x: position.x,
    y: position.y,
    vx: 0,
    vy: 0,
    mode: "orbit",
    dragOffsetX: 0,
    dragOffsetY: 0,
  };
}

export function orbitPosition(
  body: Pick<OrbitBody, "orbitX" | "orbitY" | "radiusX" | "radiusY" | "angle" | "speed">,
  elapsedSeconds: number,
): Point {
  const angle = body.angle + elapsedSeconds * body.speed;

  return {
    x: body.orbitX + Math.cos(angle) * body.radiusX,
    y: body.orbitY + Math.sin(angle) * body.radiusY,
  };
}

export function beginDrag(body: OrbitBody, pointer: Point): OrbitBody {
  return {
    ...body,
    mode: "drag",
    vx: 0,
    vy: 0,
    // Preserve the grab point so the capsule does not snap to the cursor center.
    dragOffsetX: body.x - pointer.x,
    dragOffsetY: body.y - pointer.y,
  };
}

export function moveDrag(body: OrbitBody, pointer: Point): OrbitBody {
  if (body.mode !== "drag") {
    return body;
  }

  return {
    ...body,
    x: pointer.x + body.dragOffsetX,
    y: pointer.y + body.dragOffsetY,
  };
}

export function releaseDrag(body: OrbitBody, velocity: Point): OrbitBody {
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
  body: OrbitBody,
  {
    elapsedSeconds,
    dtSeconds,
    spring = 18,
    damping = 6,
    snapDistance = 0.75,
    snapVelocity = 6,
  }: {
    elapsedSeconds: number;
    dtSeconds: number;
    spring?: number;
    damping?: number;
    snapDistance?: number;
    snapVelocity?: number;
  },
): OrbitBody {
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

  // Released capsules are pulled back with a damped spring, like a charged body
  // settling back into a stable orbit rather than snapping to a grid.
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

export function resolveBodyCollisions(
  bodies: OrbitBody[],
  {
    minDistance,
    iterations = 3,
  }: {
    minDistance: number;
    iterations?: number;
  },
) {
  const resolved = bodies.map((body) => ({ ...body }));

  for (let iteration = 0; iteration < iterations; iteration += 1) {
    for (let firstIndex = 0; firstIndex < resolved.length; firstIndex += 1) {
      for (let secondIndex = firstIndex + 1; secondIndex < resolved.length; secondIndex += 1) {
        const first = resolved[firstIndex];
        const second = resolved[secondIndex];
        const dx = second.x - first.x;
        const dy = second.y - first.y;
        const distance = Math.hypot(dx, dy);

        if (distance >= minDistance) {
          continue;
        }

        const fallbackAngle = (firstIndex + secondIndex + 1) * 2.399963;
        const directionX = distance > 0.001 ? dx / distance : Math.cos(fallbackAngle);
        const directionY = distance > 0.001 ? dy / distance : Math.sin(fallbackAngle);
        const overlap = minDistance - Math.max(distance, 0.001);
        const firstLocked = first.mode === "drag";
        const secondLocked = second.mode === "drag";

        if (firstLocked && secondLocked) {
          continue;
        }

        if (firstLocked) {
          second.x += directionX * overlap;
          second.y += directionY * overlap;
          continue;
        }

        if (secondLocked) {
          first.x -= directionX * overlap;
          first.y -= directionY * overlap;
          continue;
        }

        first.x -= directionX * overlap * 0.5;
        first.y -= directionY * overlap * 0.5;
        second.x += directionX * overlap * 0.5;
        second.y += directionY * overlap * 0.5;
      }
    }
  }

  return resolved;
}

function clamp(value: number, min: number, max: number) {
  return Math.min(Math.max(value, min), max);
}
