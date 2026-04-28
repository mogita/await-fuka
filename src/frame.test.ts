import {test, expect} from 'bun:test';
import {composeFrame} from './frame';
import {freshState} from './state';

function pet(overrides: Partial<ReturnType<typeof freshState>> = {}) {
  return {...freshState(0), stage: 'pet' as const, ...overrides};
}

test('returns 32x32 matrix', () => {
  const m = composeFrame(freshState(0));
  expect(m.length).toBe(32);
  for (const row of m) expect(row.length).toBe(32);
});

test('all values are in [0, 1]', () => {
  const m = composeFrame(pet({hunger: 2, hasPoop: true}));
  for (const row of m) {
    for (const v of row) {
      expect(v).toBeGreaterThanOrEqual(0);
      expect(v).toBeLessThanOrEqual(1);
    }
  }
});

test('egg stage hides menu, ground, hearts', () => {
  const m = composeFrame(freshState(0));
  for (let r = 0; r < 4; r++) {
    for (let c = 0; c < 32; c++) expect(m[r]![c]!).toBe(0);
  }
  for (let c = 0; c < 32; c++) expect(m[23]![c]!).toBe(0);
  for (let r = 28; r < 32; r++) {
    for (let c = 0; c < 32; c++) expect(m[r]![c]!).toBe(0);
  }
});

test('egg stage paints egg sprite in pet area', () => {
  const m = composeFrame(freshState(0));
  let nonZero = 0;
  for (let r = 7; r <= 22; r++) {
    for (let c = 8; c <= 23; c++) if (m[r]![c]! > 0) nonZero++;
  }
  expect(nonZero).toBeGreaterThan(0);
});

test('pet stage paints menu icons', () => {
  const m = composeFrame(pet());
  let nonZero = 0;
  for (let r = 0; r < 4; r++) {
    for (let c = 0; c < 32; c++) if (m[r]![c]! > 0) nonZero++;
  }
  expect(nonZero).toBeGreaterThan(0);
});

test('cursor=feed: feed icon brighter than clean icon', () => {
  const m = composeFrame(pet({menuCursor: 'feed'}));
  let maxFeed = 0;
  let maxClean = 0;
  for (let r = 0; r < 4; r++) {
    for (let c = 4; c <= 17; c++) maxFeed = Math.max(maxFeed, m[r]![c]!);
    for (let c = 18; c <= 31; c++) maxClean = Math.max(maxClean, m[r]![c]!);
  }
  expect(maxFeed).toBeGreaterThan(maxClean);
});

test('cursor=clean: clean icon brighter than feed icon', () => {
  const m = composeFrame(pet({menuCursor: 'clean'}));
  let maxFeed = 0;
  let maxClean = 0;
  for (let r = 0; r < 4; r++) {
    for (let c = 4; c <= 17; c++) maxFeed = Math.max(maxFeed, m[r]![c]!);
    for (let c = 18; c <= 31; c++) maxClean = Math.max(maxClean, m[r]![c]!);
  }
  expect(maxClean).toBeGreaterThan(maxFeed);
});

test('cursor=none: feed and clean equal brightness', () => {
  const m = composeFrame(pet({menuCursor: 'none'}));
  let maxFeed = 0;
  let maxClean = 0;
  for (let r = 0; r < 4; r++) {
    for (let c = 4; c <= 17; c++) maxFeed = Math.max(maxFeed, m[r]![c]!);
    for (let c = 18; c <= 31; c++) maxClean = Math.max(maxClean, m[r]![c]!);
  }
  expect(maxFeed).toBe(maxClean);
});

test('hasPoop paints poop region', () => {
  const m = composeFrame(pet({hasPoop: true}));
  let nonZero = 0;
  for (let r = 17; r <= 22; r++) {
    for (let c = 24; c <= 29; c++) if (m[r]![c]! > 0) nonZero++;
  }
  expect(nonZero).toBeGreaterThan(0);
});

test('no poop: poop region is empty', () => {
  const m = composeFrame(pet({hasPoop: false}));
  let nonZero = 0;
  for (let r = 17; r <= 22; r++) {
    for (let c = 24; c <= 29; c++) if (m[r]![c]! > 0) nonZero++;
  }
  expect(nonZero).toBe(0);
});

test('hunger=4 lights more heart cells than hunger=2', () => {
  const m4 = composeFrame(pet({hunger: 4}));
  const m2 = composeFrame(pet({hunger: 2}));
  let lit4 = 0;
  let lit2 = 0;
  for (let r = 28; r < 32; r++) {
    for (let c = 0; c < 32; c++) {
      if (m4[r]![c]! > 0) lit4++;
      if (m2[r]![c]! > 0) lit2++;
    }
  }
  expect(lit4).toBeGreaterThan(lit2);
});

test('ground line on row 23 during pet stage', () => {
  const m = composeFrame(pet());
  let lit = 0;
  for (let c = 4; c < 28; c++) if (m[23]![c]! > 0) lit++;
  expect(lit).toBeGreaterThan(0);
});

test('action=feed shows eating sprite (different from idle)', () => {
  const idle = composeFrame(pet());
  const eating = composeFrame(pet({action: {kind: 'feed', until: 1000}}));
  // at least one cell differs in the pet area
  let differs = 0;
  for (let r = 7; r <= 22; r++) {
    for (let c = 8; c <= 23; c++) if (idle[r]![c]! !== eating[r]![c]!) differs++;
  }
  expect(differs).toBeGreaterThan(0);
});
