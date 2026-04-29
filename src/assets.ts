import {GameState, MenuCursor} from './state';
import {
  AnimatedSprite,
  eggAnim,
  petIdleAnim,
  petHungryAnim,
  petEatingAnim,
  petHappyAnim,
} from './sprites';

// Pure URL resolution. The widget calls these to look up which pre-rendered
// PNG to display for the current state and animation phase. Keep names in
// sync with prerender.tsx (the source of truth for what gets saved).

function frameIndex(anim: AnimatedSprite, now: number): number {
  return Math.floor(now / anim.intervalMs) % anim.frames.length;
}

export function petAssetUrl(state: GameState, now: number): string {
  if (state.stage === 'egg') return `assets/pet-egg-${frameIndex(eggAnim, now)}.png`;
  if (state.action?.kind === 'feed') return `assets/pet-eating-${frameIndex(petEatingAnim, now)}.png`;
  if (state.action?.kind === 'clean') return `assets/pet-happy-${frameIndex(petHappyAnim, now)}.png`;
  if (state.hunger === 0) return `assets/pet-hungry-${frameIndex(petHungryAnim, now)}.png`;
  return `assets/pet-idle-${frameIndex(petIdleAnim, now)}.png`;
}

export function feedIconUrl(cursor: MenuCursor): string {
  return cursor === 'feed' ? 'assets/icon-feed-selected.png' : 'assets/icon-feed-normal.png';
}

export function cleanIconUrl(cursor: MenuCursor): string {
  return cursor === 'clean' ? 'assets/icon-clean-selected.png' : 'assets/icon-clean-normal.png';
}

export const POOP_URL = 'assets/poop.png';
export const HEART_FILLED_URL = 'assets/heart-filled.png';
export const HEART_HOLLOW_URL = 'assets/heart-hollow.png';
