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

const DIVE_DURATION_VH = 1.8;
const VEIL_START_VH = 1.3;
const VEIL_DURATION_VH = 0.7;
const PROJECT_BG_START_VH = 2.0;
const PROJECT_BG_DURATION_VH = 0.28;
const PROJECT_HEADING_START_VH = 2.32;
const PROJECT_HEADING_DURATION_VH = 0.58;
const PROJECT_LIST_START_VH = 2.54;
const PROJECT_LIST_DURATION_VH = 1.44;

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
    dive: clamp01(scrollY / (DIVE_DURATION_VH * viewportHeight)),
    veil: progressWindow(scrollY, viewportHeight, VEIL_START_VH, VEIL_DURATION_VH),
    bgFade: progressWindow(
      scrollY,
      viewportHeight,
      PROJECT_BG_START_VH,
      PROJECT_BG_DURATION_VH,
    ),
    revealCol: progressWindow(
      scrollY,
      viewportHeight,
      PROJECT_HEADING_START_VH,
      PROJECT_HEADING_DURATION_VH,
    ),
    revealList: progressWindow(
      scrollY,
      viewportHeight,
      PROJECT_LIST_START_VH,
      PROJECT_LIST_DURATION_VH,
    ),
  };
}
