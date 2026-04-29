export type Direction = 'horizontal' | 'vertical';

export type Layout = {
  screenSide: number;
  controlSize: number;
  direction: Direction;
};

// Minimum thickness reserved for the A/B/C button strip.
// Vertical layouts (small/large): strip at the bottom, height-bound.
// Horizontal layout (medium): strip on the right, width-bound.
const VERTICAL_STRIP_MIN = 40;
// 110 keeps the LED dominant on medium (~228 wide screen on a 338 widget) while
// giving each of the three horizontally-arranged buttons ~37px width — narrow
// but tappable. 80 made buttons ~27px wide, smaller than comfortable.
const HORIZONTAL_STRIP_MIN = 110;

export function layoutFor(family: string, size: {width: number; height: number}): Layout {
  const direction: Direction = family === 'medium' ? 'horizontal' : 'vertical';

  if (direction === 'horizontal') {
    const controlSize = HORIZONTAL_STRIP_MIN;
    const screenSide = Math.max(1, Math.min(size.width - controlSize, size.height));
    return {screenSide, controlSize, direction};
  }

  // Vertical: reserve strip first; screen square is min of width and the
  // remaining height. screenSide is the design dimension used for percentage
  // positioning of sprites; the actual rendered LED area can be wider via
  // maxSides on the screen ZStack (the surrounding area gets LED_BG).
  const controlSize = VERTICAL_STRIP_MIN;
  const screenSide = Math.max(1, Math.min(size.width, size.height - controlSize));
  return {screenSide, controlSize, direction};
}
