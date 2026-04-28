import {test, expect} from 'bun:test';
import {freshState, isValidState} from './state';

test('freshState returns egg with hunger 4', () => {
  const s = freshState(1000);
  expect(s.installedAt).toBe(1000);
  expect(s.stage).toBe('egg');
  expect(s.hunger).toBe(4);
  expect(s.hasPoop).toBe(false);
  expect(s.menuCursor).toBe('none');
  expect(s.action).toBeUndefined();
  expect(s.lastHungerCheckAt).toBe(1000);
  expect(s.lastPoopCheckAt).toBe(1000);
});

test('isValidState accepts valid state', () => {
  const s = freshState(0);
  expect(isValidState(s)).toBe(true);
});

test('isValidState accepts state with action set', () => {
  const s = {...freshState(0), action: {kind: 'feed' as const, until: 100}};
  expect(isValidState(s)).toBe(true);
});

test('isValidState rejects undefined', () => {
  expect(isValidState(undefined)).toBe(false);
});

test('isValidState rejects empty object', () => {
  expect(isValidState({})).toBe(false);
});

test('isValidState rejects state with wrong stage', () => {
  const s = {...freshState(0), stage: 'adult'};
  expect(isValidState(s)).toBe(false);
});

test('isValidState rejects state with non-number hunger', () => {
  const s = {...freshState(0), hunger: 'four'};
  expect(isValidState(s)).toBe(false);
});

test('isValidState rejects state with hunger out of bounds', () => {
  const s = {...freshState(0), hunger: 5};
  expect(isValidState(s)).toBe(false);
});

test('isValidState rejects state with bad action shape', () => {
  const s = {...freshState(0), action: {kind: 'sneeze', until: 100}};
  expect(isValidState(s)).toBe(false);
});
