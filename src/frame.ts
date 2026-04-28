import {GameState} from './state';
import {
  eggSprite,
  petIdleSprite,
  petHungrySprite,
  petEatingSprite,
  petHappySprite,
  poopSprite,
  feedIcon,
  cleanIcon,
  filledHeart,
  hollowHeart,
} from './sprites';

const SCREEN_SIZE = 32;
const SELECTED_BRIGHTNESS = 1;
const UNSELECTED_BRIGHTNESS = 0.5;
const GROUND_BRIGHTNESS = 0.4;

const PET_ROW = 7;
const PET_COL = 8;
const POOP_ROW = 17;
const POOP_COL = 24;
const GROUND_ROW = 23;
const FEED_ICON_COL = 4;
const CLEAN_ICON_COL = 18;
const ICON_ROW = 0;
const HEART_ROW = 28;
const HEART_GAP = 1;

function blank(): number[][] {
  const m: number[][] = [];
  for (let r = 0; r < SCREEN_SIZE; r++) {
    const row = new Array<number>(SCREEN_SIZE).fill(0);
    m.push(row);
  }
  return m;
}

function paint(
  matrix: number[][],
  sprite: readonly number[][],
  rowOffset: number,
  colOffset: number,
  brightnessScale: number = 1,
): void {
  for (let sr = 0; sr < sprite.length; sr++) {
    const row = sprite[sr]!;
    for (let sc = 0; sc < row.length; sc++) {
      const v = row[sc]!;
      if (v <= 0) continue;
      const dr = rowOffset + sr;
      const dc = colOffset + sc;
      if (dr < 0 || dr >= SCREEN_SIZE || dc < 0 || dc >= SCREEN_SIZE) continue;
      matrix[dr]![dc] = v * brightnessScale;
    }
  }
}

function paintGround(matrix: number[][]): void {
  for (let c = 4; c < 28; c++) {
    matrix[GROUND_ROW]![c] = GROUND_BRIGHTNESS;
  }
}

function paintHearts(matrix: number[][], hunger: number): void {
  const heartWidth = filledHeart[0]!.length;
  const totalWidth = 4 * heartWidth + 3 * HEART_GAP;
  const startCol = Math.floor((SCREEN_SIZE - totalWidth) / 2);
  for (let i = 0; i < 4; i++) {
    const sprite = i < hunger ? filledHeart : hollowHeart;
    const col = startCol + i * (heartWidth + HEART_GAP);
    paint(matrix, sprite, HEART_ROW, col);
  }
}

function pickPetSprite(state: GameState): readonly number[][] {
  if (state.stage === 'egg') return eggSprite;
  if (state.action?.kind === 'feed') return petEatingSprite;
  if (state.action?.kind === 'clean') return petHappySprite;
  if (state.hunger === 0) return petHungrySprite;
  return petIdleSprite;
}

export function composeFrame(state: GameState): number[][] {
  const m = blank();

  if (state.stage === 'pet') {
    const feedScale = state.menuCursor === 'feed' ? SELECTED_BRIGHTNESS : UNSELECTED_BRIGHTNESS;
    const cleanScale = state.menuCursor === 'clean' ? SELECTED_BRIGHTNESS : UNSELECTED_BRIGHTNESS;
    paint(m, feedIcon, ICON_ROW, FEED_ICON_COL, feedScale);
    paint(m, cleanIcon, ICON_ROW, CLEAN_ICON_COL, cleanScale);
  }

  paint(m, pickPetSprite(state), PET_ROW, PET_COL);

  if (state.stage === 'pet' && state.hasPoop) {
    paint(m, poopSprite, POOP_ROW, POOP_COL);
  }

  if (state.stage === 'pet') {
    paintGround(m);
    paintHearts(m, state.hunger);
  }

  return m;
}
