import {test, expect} from 'bun:test';
import {applyCycle, applyExecute, applyCancel} from './intents';
import {freshState} from './state';

function petState() {
  return {...freshState(0), stage: 'pet' as const};
}

test('applyCycle: none -> feed', () => {
  const s = {...petState(), menuCursor: 'none' as const};
  expect(applyCycle(s).menuCursor).toBe('feed');
});

test('applyCycle: feed -> clean', () => {
  const s = {...petState(), menuCursor: 'feed' as const};
  expect(applyCycle(s).menuCursor).toBe('clean');
});

test('applyCycle: clean -> none', () => {
  const s = {...petState(), menuCursor: 'clean' as const};
  expect(applyCycle(s).menuCursor).toBe('none');
});

test('applyCycle: no-op during egg', () => {
  const s = freshState(0);
  expect(applyCycle(s)).toBe(s);
});

test('applyCancel: clears cursor on pet', () => {
  const s = {...petState(), menuCursor: 'feed' as const};
  expect(applyCancel(s).menuCursor).toBe('none');
});

test('applyCancel: no-op during egg', () => {
  const s = freshState(0);
  expect(applyCancel(s)).toBe(s);
});

test('applyExecute: feeds when cursor=feed and hunger<4', () => {
  const s = {...petState(), hunger: 2, menuCursor: 'feed' as const};
  const r = applyExecute(s, 1000, 1);
  expect(r.hunger).toBe(3);
  expect(r.action).toEqual({kind: 'feed', until: 1000 + 800});
});

test('applyExecute: no-op when hunger=4 and cursor=feed', () => {
  const s = {...petState(), hunger: 4, menuCursor: 'feed' as const};
  expect(applyExecute(s, 1000, 1)).toBe(s);
});

test('applyExecute: cleans when cursor=clean and hasPoop', () => {
  const s = {...petState(), hasPoop: true, menuCursor: 'clean' as const};
  const r = applyExecute(s, 1000, 1);
  expect(r.hasPoop).toBe(false);
  expect(r.lastPoopCheckAt).toBe(1000);
  expect(r.action).toEqual({kind: 'clean', until: 1000 + 800});
});

test('applyExecute: no-op when no poop and cursor=clean', () => {
  const s = {...petState(), hasPoop: false, menuCursor: 'clean' as const};
  expect(applyExecute(s, 1000, 1)).toBe(s);
});

test('applyExecute: no-op when cursor=none', () => {
  const s = {...petState(), menuCursor: 'none' as const};
  expect(applyExecute(s, 1000, 1)).toBe(s);
});

test('applyExecute: no-op during egg', () => {
  const s = {...freshState(0), menuCursor: 'feed' as const};
  expect(applyExecute(s, 1000, 1)).toBe(s);
});

test('applyExecute: no-op when action is set', () => {
  const s = {
    ...petState(),
    hunger: 2,
    menuCursor: 'feed' as const,
    action: {kind: 'feed' as const, until: 5000},
  };
  expect(applyExecute(s, 1000, 1)).toBe(s);
});

test('applyExecute: action duration scales with worldSpeed', () => {
  const s = {...petState(), hunger: 2, menuCursor: 'feed' as const};
  const r = applyExecute(s, 1000, 100);
  expect(r.action!.until).toBe(1000 + 8); // 800 / 100
});
