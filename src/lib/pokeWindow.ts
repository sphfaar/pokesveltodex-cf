/** Grid track from `--grid-template-columns-pokegrid` in app.css. */
export const POKE_MIN_TRACK = 308;
/** Visible rows, plus about one viewport each side, plus a small fling buffer. */
export const POKE_WARM_SCREENS = 1;
export const POKE_OVERSCAN_ROWS = 2;
/**
 * Fixed shell height. Includes the `py-3` that used to be `my-3` on the card,
 * so a skeleton and a loaded card share one row and the thumb does not jump.
 */
export const POKE_CELL_HEIGHT = 260;
/** First paint, before the list has been measured. Matches server and client. */
export const INITIAL_WARM = 24;

export function columnsForWidth(
  innerWidth: number,
  minTrack = POKE_MIN_TRACK,
  gap = 8,
): number {
  if (!(innerWidth > 0)) return 1;
  const stride = minTrack + gap;
  if (!(stride > 0)) return 1;
  return Math.max(1, Math.floor((innerWidth + gap) / stride));
}

export function indexRange(args: {
  count: number;
  columns: number;
  cellHeight: number;
  rowGap: number;
  listTop: number;
  padTop: number;
  scrollY: number;
  viewportH: number;
  warmScreens?: number;
  overscanRows?: number;
}): { start: number; end: number } {
  const count = Math.max(0, args.count);
  const columns = Math.max(1, args.columns);
  if (count === 0) return { start: 0, end: 0 };

  const stride = args.cellHeight + args.rowGap;
  if (!(stride > 0) || !(args.viewportH > 0)) {
    return { start: 0, end: Math.min(count, INITIAL_WARM) };
  }

  const warm = args.warmScreens ?? POKE_WARM_SCREENS;
  const overscan = args.overscanRows ?? POKE_OVERSCAN_ROWS;
  const rowCount = Math.ceil(count / columns);
  const rowsTop = args.listTop + args.padTop;
  const warmTop = args.scrollY - args.viewportH * warm;
  const warmBottom = args.scrollY + args.viewportH * (1 + warm);
  let startRow = Math.floor((warmTop - rowsTop) / stride) - overscan;
  let endRow = Math.ceil((warmBottom - rowsTop) / stride) + overscan;
  if (startRow < 0) startRow = 0;
  if (endRow > rowCount) endRow = rowCount;
  if (endRow < startRow) endRow = startRow;

  return {
    start: Math.min(count, startRow * columns),
    end: Math.min(count, endRow * columns),
  };
}
