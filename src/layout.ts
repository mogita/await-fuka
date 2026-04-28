export type Direction = 'horizontal' | 'vertical';

export type Layout = {
  cellSide: number;
  screenSide: number;
  controlSize: number;
  direction: Direction;
};

export function layoutFor(family: string, size: {width: number; height: number}): Layout {
  const minSide = Math.min(size.width, size.height);
  const cellSide = Math.max(1, Math.floor(minSide / 32));
  const screenSide = cellSide * 32;
  const direction: Direction = family === 'medium' ? 'horizontal' : 'vertical';
  const controlSize = direction === 'horizontal'
    ? Math.max(0, size.width - screenSide)
    : Math.max(0, size.height - screenSide);

  return {cellSide, screenSide, controlSize, direction};
}
