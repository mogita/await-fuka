import {test, expect} from 'bun:test';
import {petAnimSpec, feedIconUrl, cleanIconUrl} from './assets';
import {freshState, GameState} from './state';

function pet(overrides: Partial<GameState> = {}): GameState {
  return {...freshState(0), stage: 'pet', ...overrides};
}

test('petAnimSpec: egg stage returns 2 egg frames with fs02', () => {
  const s = freshState(0);
  const spec = petAnimSpec(s);
  expect(spec.urls).toEqual(['assets/pet-egg-0.png', 'assets/pet-egg-1.png']);
  expect(spec.feature).toBe('fs02');
});

test('petAnimSpec: feed action returns 4 eating frames with fs04', () => {
  const s = pet({action: {kind: 'feed', until: 999999}});
  const spec = petAnimSpec(s);
  expect(spec.urls).toEqual([
    'assets/pet-eating-0.png',
    'assets/pet-eating-1.png',
    'assets/pet-eating-2.png',
    'assets/pet-eating-3.png',
  ]);
  expect(spec.feature).toBe('fs04');
});

test('petAnimSpec: clean action returns 2 happy frames with fs02', () => {
  const s = pet({action: {kind: 'clean', until: 999999}});
  const spec = petAnimSpec(s);
  expect(spec.urls).toEqual(['assets/pet-happy-0.png', 'assets/pet-happy-1.png']);
  expect(spec.feature).toBe('fs02');
});

test('petAnimSpec: hunger=0 with no action returns 2 hungry frames with fs02', () => {
  const s = pet({hunger: 0});
  const spec = petAnimSpec(s);
  expect(spec.urls).toEqual(['assets/pet-hungry-0.png', 'assets/pet-hungry-1.png']);
  expect(spec.feature).toBe('fs02');
});

test('petAnimSpec: idle (default) returns 2 idle frames with fs02', () => {
  const s = pet();
  const spec = petAnimSpec(s);
  expect(spec.urls).toEqual(['assets/pet-idle-0.png', 'assets/pet-idle-1.png']);
  expect(spec.feature).toBe('fs02');
});

test('petAnimSpec: action takes priority over hunger=0', () => {
  const s = pet({hunger: 0, action: {kind: 'feed', until: 999999}});
  const spec = petAnimSpec(s);
  expect(spec.urls[0]).toBe('assets/pet-eating-0.png');
  expect(spec.feature).toBe('fs04');
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
