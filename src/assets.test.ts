import {test, expect} from 'bun:test';
import {petAssetUrl, feedIconUrl, cleanIconUrl} from './assets';
import {freshState, GameState} from './state';
import {eggAnim, petIdleAnim, petHungryAnim, petEatingAnim, petHappyAnim} from './sprites';

function pet(overrides: Partial<GameState> = {}): GameState {
  return {...freshState(0), stage: 'pet', ...overrides};
}

test('petAssetUrl: egg stage returns indexed egg URL', () => {
  const s = freshState(0);
  expect(petAssetUrl(s, 0)).toBe('assets/pet-egg-0.png');
  // eggAnim.intervalMs = 700, 2 frames. now = 700 picks frame 1.
  expect(petAssetUrl(s, eggAnim.intervalMs)).toBe('assets/pet-egg-1.png');
  // After a full cycle we wrap back to 0.
  expect(petAssetUrl(s, eggAnim.intervalMs * eggAnim.frames.length)).toBe('assets/pet-egg-0.png');
});

test('petAssetUrl: feed action returns eating URL indexed by now', () => {
  const s = pet({action: {kind: 'feed', until: 999999}});
  expect(petAssetUrl(s, 0)).toBe('assets/pet-eating-0.png');
  expect(petAssetUrl(s, petEatingAnim.intervalMs * 2)).toBe('assets/pet-eating-2.png');
});

test('petAssetUrl: clean action returns happy URL indexed by now', () => {
  const s = pet({action: {kind: 'clean', until: 999999}});
  expect(petAssetUrl(s, 0)).toBe('assets/pet-happy-0.png');
  expect(petAssetUrl(s, petHappyAnim.intervalMs)).toBe('assets/pet-happy-1.png');
});

test('petAssetUrl: hunger=0 with no action returns hungry URL', () => {
  const s = pet({hunger: 0});
  expect(petAssetUrl(s, 0)).toBe('assets/pet-hungry-0.png');
  expect(petAssetUrl(s, petHungryAnim.intervalMs)).toBe('assets/pet-hungry-1.png');
});

test('petAssetUrl: idle (default) returns idle URL', () => {
  const s = pet();
  expect(petAssetUrl(s, 0)).toBe('assets/pet-idle-0.png');
  expect(petAssetUrl(s, petIdleAnim.intervalMs)).toBe('assets/pet-idle-1.png');
});

test('petAssetUrl: action takes priority over hunger=0', () => {
  const s = pet({hunger: 0, action: {kind: 'feed', until: 999999}});
  expect(petAssetUrl(s, 0)).toBe('assets/pet-eating-0.png');
});

test('feedIconUrl: returns selected when cursor=feed, normal otherwise', () => {
  expect(feedIconUrl('feed')).toBe('assets/icon-feed-selected.png');
  expect(feedIconUrl('clean')).toBe('assets/icon-feed-normal.png');
  expect(feedIconUrl('none')).toBe('assets/icon-feed-normal.png');
});

test('cleanIconUrl: returns selected when cursor=clean, normal otherwise', () => {
  expect(cleanIconUrl('clean')).toBe('assets/icon-clean-selected.png');
  expect(cleanIconUrl('feed')).toBe('assets/icon-clean-normal.png');
  expect(cleanIconUrl('none')).toBe('assets/icon-clean-normal.png');
});

test('frame index cycles based on now / intervalMs', () => {
  const s = pet();
  const interval = petIdleAnim.intervalMs;
  // 0 -> frame 0, interval -> frame 1, 2*interval -> frame 0 (wraps).
  expect(petAssetUrl(s, 0)).toBe('assets/pet-idle-0.png');
  expect(petAssetUrl(s, interval - 1)).toBe('assets/pet-idle-0.png');
  expect(petAssetUrl(s, interval)).toBe('assets/pet-idle-1.png');
  expect(petAssetUrl(s, 2 * interval)).toBe('assets/pet-idle-0.png');
});
