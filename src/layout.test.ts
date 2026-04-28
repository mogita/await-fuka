import {test, expect} from 'bun:test';
import {layoutFor} from './layout';

test('small: vertical, cellSide from min dimension', () => {
  const l = layoutFor('small', {width: 160, height: 160});
  expect(l.direction).toBe('vertical');
  expect(l.cellSide).toBe(5); // floor(160 / 32)
  expect(l.screenSide).toBe(160);
  expect(l.controlSize).toBe(0); // 160 - 160 = 0 (square widget; not a real ratio but math holds)
});

test('medium: horizontal layout', () => {
  const l = layoutFor('medium', {width: 320, height: 160});
  expect(l.direction).toBe('horizontal');
  expect(l.cellSide).toBe(5); // floor(min(320, 160) / 32)
  expect(l.screenSide).toBe(160);
  expect(l.controlSize).toBe(160); // 320 - 160
});

test('large: vertical layout, larger cells', () => {
  const l = layoutFor('large', {width: 320, height: 320});
  expect(l.direction).toBe('vertical');
  expect(l.cellSide).toBe(10);
  expect(l.screenSide).toBe(320);
});

test('cellSide minimum 1', () => {
  const l = layoutFor('small', {width: 16, height: 16});
  expect(l.cellSide).toBe(1);
});

test('non-medium family falls back to vertical', () => {
  const l = layoutFor('extraLarge', {width: 160, height: 160});
  expect(l.direction).toBe('vertical');
});

test('rectangular small uses min dimension', () => {
  const l = layoutFor('small', {width: 200, height: 160});
  expect(l.cellSide).toBe(5);
  expect(l.screenSide).toBe(160);
  expect(l.controlSize).toBe(0); // height - screen, but we have leftover width too; for vertical layout controlSize is height-based
});
