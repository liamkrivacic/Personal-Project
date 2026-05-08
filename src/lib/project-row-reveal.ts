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
  entryProgress,
  rowIndex,
  rowCount,
}: {
  rowTop: number;
  viewportHeight: number;
  entryProgress?: number;
  rowIndex?: number;
  rowCount?: number;
}) {
  if (viewportHeight <= 0) return 1;

  const start = viewportHeight * 0.98;
  const end = viewportHeight * 0.72;
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
  const entryDelay = 0.16;
  const sequencedEntryProgress = smoothstep01((entryProgress - entryDelay) / (1 - entryDelay));
  const entryStaggerWindow = 0.82;
  const entryDuration = 0.18;
  const entryStart = count === 1 ? 0 : (index / (count - 1)) * entryStaggerWindow;
  const entryReveal = smoothstep01((sequencedEntryProgress - entryStart) / entryDuration);

  return Math.min(viewportReveal, entryReveal);
}
