function clamp01(value: number) {
  return Math.min(Math.max(value, 0), 1);
}

function smoothstep01(value: number) {
  const c = clamp01(value);
  return c * c * (3 - 2 * c);
}

const VIEWPORT_REVEAL_START = 0.98;
const VIEWPORT_REVEAL_END = 0.72;
const ENTRY_DELAY = 0.24;
const INTRO_REVEAL_DURATION = 0.28;
const INTRO_GAP = 0.44;
const LATER_ROW_ENTRY_START = 0.98;
const LATER_ROW_ENTRY_DURATION = 0.02;
const HEADING_REVEAL_START = 0.9;
const HEADING_REVEAL_DURATION = 0.08;

export function projectRowReveal({
  rowTop,
  viewportHeight,
  entryProgress,
  headingProgress,
  rowIndex,
  rowCount,
}: {
  rowTop: number;
  viewportHeight: number;
  entryProgress?: number;
  headingProgress?: number;
  rowIndex?: number;
  rowCount?: number;
}) {
  if (viewportHeight <= 0) return 1;

  const start = viewportHeight * VIEWPORT_REVEAL_START;
  const end = viewportHeight * VIEWPORT_REVEAL_END;
  const viewportReveal = smoothstep01((start - rowTop) / (start - end));

  if (
    entryProgress === undefined ||
    rowIndex === undefined ||
    rowCount === undefined ||
    rowCount <= 0
  ) {
    return viewportReveal;
  }

  const count = Math.max(1, rowCount);
  const index = Math.min(Math.max(rowIndex, 0), count - 1);
  const sequencedEntryProgress = smoothstep01((entryProgress - ENTRY_DELAY) / (1 - ENTRY_DELAY));
  const entryDuration = index < 2 ? INTRO_REVEAL_DURATION : LATER_ROW_ENTRY_DURATION;
  const entryStart =
    index < 2 ? index * (INTRO_REVEAL_DURATION + INTRO_GAP) : LATER_ROW_ENTRY_START;
  const entryReveal = smoothstep01((sequencedEntryProgress - entryStart) / entryDuration);
  const headingReveal =
    headingProgress === undefined
      ? 1
      : smoothstep01((headingProgress - HEADING_REVEAL_START) / HEADING_REVEAL_DURATION);

  return Math.min(viewportReveal, entryReveal, headingReveal);
}
