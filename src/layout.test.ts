import {test, expect} from 'bun:test';
import {layoutFor} from './layout';

// Vertical-direction families reserve 50px for the button strip; the screen
// fits into (height - 50) capped by width.

test('small (158x158): vertical, screen squeezed to fit strip', () => {
  const l = layoutFor('small', {width: 158, height: 158});
  expect(l.direction).toBe('vertical');
  // available height = 158 - 50 = 108; screenMax = min(158, 108) = 108
  // cellSide = floor(108/48) = 2; screenSide = 96
  expect(l.cellSide).toBe(2);
  expect(l.screenSide).toBe(96);
  expect(l.controlSize).toBe(50);
});

test('medium (338x158): horizontal layout, screen square fills height', () => {
  const l = layoutFor('medium', {width: 338, height: 158});
  expect(l.direction).toBe('horizontal');
  // cellSide = floor(min(338, 158)/48) = 3; screenSide = 144
  // controlSize = 338 - 144 = 194
  expect(l.cellSide).toBe(3);
  expect(l.screenSide).toBe(144);
  expect(l.controlSize).toBe(194);
});

test('large (338x354): vertical, larger cells', () => {
  const l = layoutFor('large', {width: 338, height: 354});
  expect(l.direction).toBe('vertical');
  // available height = 354 - 50 = 304; screenMax = min(338, 304) = 304
  // cellSide = floor(304/48) = 6; screenSide = 288
  expect(l.cellSide).toBe(6);
  expect(l.screenSide).toBe(288);
  expect(l.controlSize).toBe(50);
});

test('cellSide minimum 1 even at tiny dimensions', () => {
  const l = layoutFor('small', {width: 16, height: 70});
  expect(l.cellSide).toBe(1);
});

test('non-medium family falls back to vertical', () => {
  const l = layoutFor('extraLarge', {width: 200, height: 200});
  expect(l.direction).toBe('vertical');
  expect(l.controlSize).toBe(50);
});

test('rectangular small caps screen by available height', () => {
  const l = layoutFor('small', {width: 300, height: 158});
  // available height = 158 - 50 = 108; screenMax = min(300, 108) = 108
  // cellSide = floor(108/48) = 2; screenSide = 96
  expect(l.cellSide).toBe(2);
  expect(l.screenSide).toBe(96);
  expect(l.controlSize).toBe(50);
});

test('medium too short for screen reserves no negative', () => {
  // Pathological case: medium with height < 48. cellSide minimum is 1; controlSize >= 0.
  const l = layoutFor('medium', {width: 100, height: 20});
  expect(l.cellSide).toBe(1);
  expect(l.screenSide).toBe(48);
  expect(l.controlSize).toBeGreaterThanOrEqual(0);
});
