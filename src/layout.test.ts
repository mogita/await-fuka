import {test, expect} from 'bun:test';
import {layoutFor} from './layout';

// Vertical-direction families reserve 50px for the button strip; the screen
// fits into (height - 50) capped by width.

test('small (158x158): vertical, screen squeezed to fit strip', () => {
  const l = layoutFor('small', {width: 158, height: 158});
  expect(l.direction).toBe('vertical');
  // available height = 158 - 50 = 108; screenMax = min(158, 108) = 108
  // cellSide = floor(108/32) = 3; screenSide = 96
  expect(l.cellSide).toBe(3);
  expect(l.screenSide).toBe(96);
  expect(l.controlSize).toBe(50);
});

test('medium (338x158): horizontal layout, screen square fills height', () => {
  const l = layoutFor('medium', {width: 338, height: 158});
  expect(l.direction).toBe('horizontal');
  // cellSide = floor(min(338, 158)/32) = 4; screenSide = 128
  // controlSize = 338 - 128 = 210
  expect(l.cellSide).toBe(4);
  expect(l.screenSide).toBe(128);
  expect(l.controlSize).toBe(210);
});

test('large (338x354): vertical, larger cells', () => {
  const l = layoutFor('large', {width: 338, height: 354});
  expect(l.direction).toBe('vertical');
  // available height = 354 - 50 = 304; screenMax = min(338, 304) = 304
  // cellSide = floor(304/32) = 9; screenSide = 288
  expect(l.cellSide).toBe(9);
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
  // cellSide = 3; screenSide = 96
  expect(l.cellSide).toBe(3);
  expect(l.screenSide).toBe(96);
  expect(l.controlSize).toBe(50);
});

test('medium too short for screen reserves no negative', () => {
  // Pathological case: medium with height < 32. cellSide minimum is 1; controlSize >= 0.
  const l = layoutFor('medium', {width: 100, height: 20});
  expect(l.cellSide).toBe(1);
  expect(l.screenSide).toBe(32);
  expect(l.controlSize).toBeGreaterThanOrEqual(0);
});
