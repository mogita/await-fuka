import {GameState} from './state';
import {
  AnimatedSprite,
  eggAnim,
  petIdleAnim,
  petHungryAnim,
  petEatingAnim,
  petHappyAnim,
  poopSprite,
  feedIcon,
  cleanIcon,
  filledHeart,
  hollowHeart,
} from './sprites';

const SCREEN_SIZE = 48;
const SELECTED_BRIGHTNESS = 1;
const UNSELECTED_BRIGHTNESS = 0.5;
const GROUND_BRIGHTNESS = 0.4;

const PET_ROW = 10;
const PET_COL = 12;
const POOP_ROW = 25;
const POOP_COL = 36;
const GROUND_ROW = 34;
// 12-wide icons centered in each 24-wide menu half: left half col 0..23 => col 6,
// right half col 24..47 => col 30. ICON_ROW=1 vertically centers a 6-tall icon
// inside the 8-row top strip.
const FEED_ICON_COL = 6;
const CLEAN_ICON_COL = 30;
const ICON_ROW = 1;
// Hearts grew from 4 to 5 rows (added bottom tip); shift up one to leave a
// 2-row bottom margin (rows 46-47).
const HEART_ROW = 41;
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
  for (let c = 4; c < 44; c++) {
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

// Pick the active frame of an animation by absolute wall-clock time. Using
// floor(now/interval) makes the animation phase global across timeline entries
// and across widget re-renders, so no per-state animation phase is needed.
function pickAnimFrame(anim: AnimatedSprite, now: number): readonly number[][] {
  const idx = Math.floor(now / anim.intervalMs) % anim.frames.length;
  return anim.frames[idx]!;
}

function pickPetSprite(state: GameState, now: number): readonly number[][] {
  if (state.stage === 'egg') return pickAnimFrame(eggAnim, now);
  if (state.action?.kind === 'feed') return pickAnimFrame(petEatingAnim, now);
  if (state.action?.kind === 'clean') return pickAnimFrame(petHappyAnim, now);
  if (state.hunger === 0) return pickAnimFrame(petHungryAnim, now);
  return pickAnimFrame(petIdleAnim, now);
}

export function composeFrame(state: GameState, now: number): number[][] {
  const m = blank();

  if (state.stage === 'pet') {
    const feedScale = state.menuCursor === 'feed' ? SELECTED_BRIGHTNESS : UNSELECTED_BRIGHTNESS;
    const cleanScale = state.menuCursor === 'clean' ? SELECTED_BRIGHTNESS : UNSELECTED_BRIGHTNESS;
    paint(m, feedIcon, ICON_ROW, FEED_ICON_COL, feedScale);
    paint(m, cleanIcon, ICON_ROW, CLEAN_ICON_COL, cleanScale);
  }

  paint(m, pickPetSprite(state, now), PET_ROW, PET_COL);

  if (state.stage === 'pet' && state.hasPoop) {
    paint(m, poopSprite, POOP_ROW, POOP_COL);
  }

  if (state.stage === 'pet') {
    paintGround(m);
    paintHearts(m, state.hunger);
  }

  return m;
}
