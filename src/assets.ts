import {GameState, MenuCursor} from './state';

// Pure URL resolution. The widget calls these to look up which pre-rendered
// PNG to display for the current state. Animation cycling is handled by the
// Widget font's frame-select features (fs02 for 2-frame cycles, fs04 for
// 4-frame cycles); petAnimSpec returns the URL list and feature name, and
// the runtime swaps which Image child is visible based on wall-clock phase.
// Asset names must stay in sync with prerender.tsx (the source of truth for
// what gets saved).

export type PetAnimSpec = {
  urls: readonly string[];
  feature: 'fs02' | 'fs04';
};

const PET_EGG_URLS = ['assets/pet-egg-0.png', 'assets/pet-egg-1.png'] as const;
const PET_IDLE_URLS = ['assets/pet-idle-0.png', 'assets/pet-idle-1.png'] as const;
const PET_HUNGRY_URLS = ['assets/pet-hungry-0.png', 'assets/pet-hungry-1.png'] as const;
const PET_HAPPY_URLS = ['assets/pet-happy-0.png', 'assets/pet-happy-1.png'] as const;
const PET_EATING_URLS = [
  'assets/pet-eating-0.png',
  'assets/pet-eating-1.png',
  'assets/pet-eating-2.png',
  'assets/pet-eating-3.png',
] as const;

export function petAnimSpec(state: GameState): PetAnimSpec {
  if (state.stage === 'egg') return {urls: PET_EGG_URLS, feature: 'fs02'};
  if (state.action?.kind === 'feed') return {urls: PET_EATING_URLS, feature: 'fs04'};
  if (state.action?.kind === 'clean') return {urls: PET_HAPPY_URLS, feature: 'fs02'};
  if (state.hunger === 0) return {urls: PET_HUNGRY_URLS, feature: 'fs02'};
  return {urls: PET_IDLE_URLS, feature: 'fs02'};
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
