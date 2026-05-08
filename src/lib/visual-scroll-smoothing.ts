const DEFAULT_FOLLOW_RATE = 24;
const DEFAULT_MAX_SPEED_VH = 4.8;
const DEFAULT_SNAP_PX = 0.75;

function clamp(value: number, min: number, max: number) {
  return Math.min(Math.max(value, min), max);
}

export function nextVisualScrollY({
  currentY,
  targetY,
  viewportHeight,
  elapsedMs,
  followRate = DEFAULT_FOLLOW_RATE,
  maxSpeedVh = DEFAULT_MAX_SPEED_VH,
  snapPx = DEFAULT_SNAP_PX,
}: {
  currentY: number;
  targetY: number;
  viewportHeight: number;
  elapsedMs: number;
  followRate?: number;
  maxSpeedVh?: number;
  snapPx?: number;
}) {
  if (!Number.isFinite(currentY) || !Number.isFinite(targetY)) {
    return Number.isFinite(targetY) ? targetY : 0;
  }

  const distance = targetY - currentY;
  if (Math.abs(distance) <= snapPx) {
    return targetY;
  }

  const dt = clamp(elapsedMs / 1000, 1 / 240, 1 / 20);
  const follow = 1 - Math.exp(-dt * followRate);
  const viewport = Math.max(1, viewportHeight);
  const maxStep = viewport * maxSpeedVh * dt;
  const step = clamp(distance * follow, -maxStep, maxStep);
  const next = currentY + step;

  return Math.abs(targetY - next) <= snapPx ? targetY : next;
}
