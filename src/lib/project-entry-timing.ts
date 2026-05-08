function clamp01(value: number) {
  return Math.min(Math.max(value, 0), 1);
}

function smoothstep01(value: number) {
  const c = clamp01(value);
  return c * c * (3 - 2 * c);
}

function progressWindow(scrollY: number, viewportHeight: number, startVh: number, durationVh: number) {
  return smoothstep01((scrollY - startVh * viewportHeight) / (durationVh * viewportHeight));
}

export function projectEntryTiming({
  scrollY,
  viewportHeight,
}: {
  scrollY: number;
  viewportHeight: number;
}) {
  if (viewportHeight <= 0) {
    return {
      dive: 1,
      veil: 1,
      bgFade: 1,
      revealCol: 1,
      revealList: 1,
    };
  }

  return {
    dive: clamp01(scrollY / (1.8 * viewportHeight)),
    veil: progressWindow(scrollY, viewportHeight, 1.3, 0.7),
    bgFade: progressWindow(scrollY, viewportHeight, 2.0, 0.28),
    revealCol: progressWindow(scrollY, viewportHeight, 2.32, 0.58),
    revealList: progressWindow(scrollY, viewportHeight, 2.54, 1.44),
  };
}
