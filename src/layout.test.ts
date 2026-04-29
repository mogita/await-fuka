import {test, expect} from 'bun:test';
import {layoutFor} from './layout';

// VERTICAL_STRIP_MIN = 40, HORIZONTAL_STRIP_MIN = 110.
// screenSide is the design dimension (max square that fits); the actual
// rendered LED area can be wider via maxSides on the screen ZStack.

test('small (158x158): vertical', () => {
  const l = layoutFor('small', {width: 158, height: 158});
  expect(l.direction).toBe('vertical');
  // screenSide = min(158, 158 - 40) = 118
  expect(l.screenSide).toBe(118);
  expect(l.controlSize).toBe(40);
});

test('medium (338x158): horizontal layout, fixed strip', () => {
  const l = layoutFor('medium', {width: 338, height: 158});
  expect(l.direction).toBe('horizontal');
  // screenSide = min(338 - 110, 158) = min(228, 158) = 158
  expect(l.screenSide).toBe(158);
  expect(l.controlSize).toBe(110);
});

test('large (338x354): vertical, larger screen', () => {
  const l = layoutFor('large', {width: 338, height: 354});
  expect(l.direction).toBe('vertical');
  // screenSide = min(338, 354 - 40) = 314
  expect(l.screenSide).toBe(314);
  expect(l.controlSize).toBe(40);
});

test('screenSide minimum 1 even at tiny dimensions', () => {
  const l = layoutFor('small', {width: 16, height: 70});
  // screenSide = max(1, min(16, 70 - 40)) = max(1, 16) = 16
  expect(l.screenSide).toBe(16);
});

test('non-medium family falls back to vertical', () => {
  const l = layoutFor('extraLarge', {width: 200, height: 200});
  expect(l.direction).toBe('vertical');
  expect(l.controlSize).toBe(40);
});

test('rectangular small caps screen by available height', () => {
  const l = layoutFor('small', {width: 300, height: 158});
  // available height = 158 - 40 = 118; screenSide = min(300, 118) = 118
  expect(l.screenSide).toBe(118);
  expect(l.controlSize).toBe(40);
});

test('medium too narrow stays positive', () => {
  // Pathological: medium where width < strip; screenSide clamps to 1.
  const l = layoutFor('medium', {width: 50, height: 100});
  // screenSide = max(1, min(50 - 110, 100)) = max(1, min(-60, 100)) = 1
  expect(l.screenSide).toBe(1);
  expect(l.controlSize).toBe(110);
});
