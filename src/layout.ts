export type Direction = 'horizontal' | 'vertical';

export type Layout = {
  cellSide: number;
  screenSide: number;
  controlSize: number;
  direction: Direction;
};

// Minimum thickness reserved for the A/B/C button strip on vertical-direction
// families (small/large), where the strip sits at the bottom and is height-bound.
// Without this reserve the strip collapses to a few pixels and buttons get
// visually clipped at small widget dimensions (~158x158).
const VERTICAL_STRIP_MIN = 50;

export function layoutFor(family: string, size: {width: number; height: number}): Layout {
  const direction: Direction = family === 'medium' ? 'horizontal' : 'vertical';

  if (direction === 'horizontal') {
    // Medium: square screen consumes min dimension; controls take leftover width.
    const cellSide = Math.max(1, Math.floor(Math.min(size.width, size.height) / 32));
    const screenSide = cellSide * 32;
    const controlSize = Math.max(0, size.width - screenSide);
    return {cellSide, screenSide, controlSize, direction};
  }

  // Vertical (small/large/fallback): reserve the strip first, fit the screen
  // into the remaining height (still capped by width to stay square).
  const availableHeight = Math.max(0, size.height - VERTICAL_STRIP_MIN);
  const screenMax = Math.min(size.width, availableHeight);
  const cellSide = Math.max(1, Math.floor(screenMax / 32));
  const screenSide = cellSide * 32;
  return {cellSide, screenSide, controlSize: VERTICAL_STRIP_MIN, direction};
}
