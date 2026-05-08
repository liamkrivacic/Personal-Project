function clamp01(value: number) {
  return Math.min(Math.max(value, 0), 1);
}

function smoothstep01(value: number) {
  const c = clamp01(value);
  return c * c * (3 - 2 * c);
}

export function projectRowReveal({
  rowTop,
  viewportHeight,
}: {
  rowTop: number;
  viewportHeight: number;
}) {
  if (viewportHeight <= 0) return 1;

  const start = viewportHeight * 0.98;
  const end = viewportHeight * 0.72;
  return smoothstep01((start - rowTop) / (start - end));
}
