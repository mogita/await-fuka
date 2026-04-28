import {test, expect} from 'bun:test';
import {composeFrame} from './frame';
import {freshState} from './state';

function pet(overrides: Partial<ReturnType<typeof freshState>> = {}) {
  return {...freshState(0), stage: 'pet' as const, ...overrides};
}

test('returns 48x48 matrix', () => {
  const m = composeFrame(freshState(0), 0);
  expect(m.length).toBe(48);
  for (const row of m) expect(row.length).toBe(48);
});

test('all values are in [0, 1]', () => {
  const m = composeFrame(pet({hunger: 2, hasPoop: true}), 0);
  for (const row of m) {
    for (const v of row) {
      expect(v).toBeGreaterThanOrEqual(0);
      expect(v).toBeLessThanOrEqual(1);
    }
  }
});

test('egg stage hides menu, ground, hearts', () => {
  const m = composeFrame(freshState(0), 0);
  for (let r = 0; r < 8; r++) {
    for (let c = 0; c < 48; c++) expect(m[r]![c]!).toBe(0);
  }
  for (let c = 0; c < 48; c++) expect(m[34]![c]!).toBe(0);
  for (let r = 41; r < 46; r++) {
    for (let c = 0; c < 48; c++) expect(m[r]![c]!).toBe(0);
  }
});

test('egg stage paints egg sprite in pet area', () => {
  const m = composeFrame(freshState(0), 0);
  let nonZero = 0;
  for (let r = 10; r <= 33; r++) {
    for (let c = 12; c <= 35; c++) if (m[r]![c]! > 0) nonZero++;
  }
  expect(nonZero).toBeGreaterThan(0);
});

test('pet stage paints menu icons', () => {
  const m = composeFrame(pet(), 0);
  let nonZero = 0;
  for (let r = 0; r < 8; r++) {
    for (let c = 0; c < 48; c++) if (m[r]![c]! > 0) nonZero++;
  }
  expect(nonZero).toBeGreaterThan(0);
});

test('cursor=feed: feed icon brighter than clean icon', () => {
  const m = composeFrame(pet({menuCursor: 'feed'}), 0);
  let maxFeed = 0;
  let maxClean = 0;
  for (let r = 0; r < 8; r++) {
    for (let c = 4; c <= 21; c++) maxFeed = Math.max(maxFeed, m[r]![c]!);
    for (let c = 26; c <= 43; c++) maxClean = Math.max(maxClean, m[r]![c]!);
  }
  expect(maxFeed).toBeGreaterThan(maxClean);
});

test('cursor=clean: clean icon brighter than feed icon', () => {
  const m = composeFrame(pet({menuCursor: 'clean'}), 0);
  let maxFeed = 0;
  let maxClean = 0;
  for (let r = 0; r < 8; r++) {
    for (let c = 4; c <= 21; c++) maxFeed = Math.max(maxFeed, m[r]![c]!);
    for (let c = 26; c <= 43; c++) maxClean = Math.max(maxClean, m[r]![c]!);
  }
  expect(maxClean).toBeGreaterThan(maxFeed);
});

test('cursor=none: feed and clean equal brightness', () => {
  const m = composeFrame(pet({menuCursor: 'none'}), 0);
  let maxFeed = 0;
  let maxClean = 0;
  for (let r = 0; r < 8; r++) {
    for (let c = 4; c <= 21; c++) maxFeed = Math.max(maxFeed, m[r]![c]!);
    for (let c = 26; c <= 43; c++) maxClean = Math.max(maxClean, m[r]![c]!);
  }
  expect(maxFeed).toBe(maxClean);
});

test('hasPoop paints poop region', () => {
  const m = composeFrame(pet({hasPoop: true}), 0);
  let nonZero = 0;
  for (let r = 25; r <= 33; r++) {
    for (let c = 36; c <= 44; c++) if (m[r]![c]! > 0) nonZero++;
  }
  expect(nonZero).toBeGreaterThan(0);
});

test('no poop: poop region is empty', () => {
  const m = composeFrame(pet({hasPoop: false}), 0);
  let nonZero = 0;
  for (let r = 25; r <= 33; r++) {
    for (let c = 36; c <= 44; c++) if (m[r]![c]! > 0) nonZero++;
  }
  expect(nonZero).toBe(0);
});

test('hunger=4 lights more heart cells than hunger=2', () => {
  const m4 = composeFrame(pet({hunger: 4}), 0);
  const m2 = composeFrame(pet({hunger: 2}), 0);
  let lit4 = 0;
  let lit2 = 0;
  for (let r = 41; r < 46; r++) {
    for (let c = 0; c < 48; c++) {
      if (m4[r]![c]! > 0) lit4++;
      if (m2[r]![c]! > 0) lit2++;
    }
  }
  expect(lit4).toBeGreaterThan(lit2);
});

test('ground line on row 34 during pet stage', () => {
  const m = composeFrame(pet(), 0);
  let lit = 0;
  for (let c = 4; c < 44; c++) if (m[34]![c]! > 0) lit++;
  expect(lit).toBeGreaterThan(0);
});

test('action=feed shows eating sprite (different from idle)', () => {
  const idle = composeFrame(pet(), 0);
  const eating = composeFrame(pet({action: {kind: 'feed', until: 1000}}), 0);
  // at least one cell differs in the pet area
  let differs = 0;
  for (let r = 10; r <= 33; r++) {
    for (let c = 12; c <= 35; c++) if (idle[r]![c]! !== eating[r]![c]!) differs++;
  }
  expect(differs).toBeGreaterThan(0);
});

test('idle pet sprite cycles between frames over time', () => {
  const s = pet();
  const t0 = composeFrame(s, 0);
  // petIdleAnim has 1000ms interval, 2 frames: 1500ms picks frame 1.
  const t1 = composeFrame(s, 1500);
  let differs = 0;
  for (let r = 10; r <= 33; r++) {
    for (let c = 12; c <= 35; c++) if (t0[r]![c]! !== t1[r]![c]!) differs++;
  }
  expect(differs).toBeGreaterThan(0);
});
