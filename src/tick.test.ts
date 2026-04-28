import {test, expect} from 'bun:test';
import {tick, nextInterestingMoment} from './tick';
import {freshState} from './state';
import {HATCH_DURATION_MS, HUNGER_INTERVAL_MS, POOP_INTERVAL_MS} from './config';

test('tick: stays as egg before hatch duration', () => {
  const s = freshState(0);
  const t = tick(s, HATCH_DURATION_MS - 1, 1);
  expect(t.stage).toBe('egg');
});

test('tick: hatches at hatch duration', () => {
  const s = freshState(0);
  const t = tick(s, HATCH_DURATION_MS, 1);
  expect(t.stage).toBe('pet');
  expect(t.lastHungerCheckAt).toBe(HATCH_DURATION_MS);
  expect(t.lastPoopCheckAt).toBe(HATCH_DURATION_MS);
});

test('tick: worldSpeed accelerates hatch', () => {
  const s = freshState(0);
  const t = tick(s, HATCH_DURATION_MS / 100, 100);
  expect(t.stage).toBe('pet');
});

test('tick: pet hunger decays one heart per interval', () => {
  let s = freshState(0);
  s = tick(s, HATCH_DURATION_MS, 1); // hatch first
  s = tick(s, HATCH_DURATION_MS + HUNGER_INTERVAL_MS, 1);
  expect(s.hunger).toBe(3);
});

test('tick: pet hunger decays multiple intervals at once', () => {
  let s = freshState(0);
  s = tick(s, HATCH_DURATION_MS, 1);
  s = tick(s, HATCH_DURATION_MS + HUNGER_INTERVAL_MS * 2, 1);
  expect(s.hunger).toBe(2);
});

test('tick: pet hunger preserves fractional progress', () => {
  let s = freshState(0);
  s = tick(s, HATCH_DURATION_MS, 1);
  // 1.5 intervals: drop 1 heart, lastHungerCheckAt advances by 1 interval
  s = tick(s, HATCH_DURATION_MS + HUNGER_INTERVAL_MS * 1.5, 1);
  expect(s.hunger).toBe(3);
  expect(s.lastHungerCheckAt).toBe(HATCH_DURATION_MS + HUNGER_INTERVAL_MS);
});

test('tick: hunger clamped at 0', () => {
  let s = freshState(0);
  s = tick(s, HATCH_DURATION_MS, 1);
  s = tick(s, HATCH_DURATION_MS + HUNGER_INTERVAL_MS * 5, 1);
  expect(s.hunger).toBe(0);
});

test('tick: poop appears after interval', () => {
  let s = freshState(0);
  s = tick(s, HATCH_DURATION_MS, 1);
  s = tick(s, HATCH_DURATION_MS + POOP_INTERVAL_MS, 1);
  expect(s.hasPoop).toBe(true);
  expect(s.lastPoopCheckAt).toBe(HATCH_DURATION_MS + POOP_INTERVAL_MS);
});

test('tick: poop does not duplicate', () => {
  let s = freshState(0);
  s = tick(s, HATCH_DURATION_MS, 1);
  s = {...s, hasPoop: true};
  const before = s.lastPoopCheckAt;
  s = tick(s, HATCH_DURATION_MS + POOP_INTERVAL_MS * 2, 1);
  expect(s.hasPoop).toBe(true);
  expect(s.lastPoopCheckAt).toBe(before);
});

test('tick: action clears when expired', () => {
  let s = freshState(0);
  s = tick(s, HATCH_DURATION_MS, 1);
  s = {...s, action: {kind: 'feed', until: HATCH_DURATION_MS + 100}};
  s = tick(s, HATCH_DURATION_MS + 100, 1);
  expect(s.action).toBeUndefined();
});

test('tick: action persists when not expired', () => {
  let s = freshState(0);
  s = tick(s, HATCH_DURATION_MS, 1);
  const action = {kind: 'feed' as const, until: HATCH_DURATION_MS + 1000};
  s = {...s, action};
  s = tick(s, HATCH_DURATION_MS + 500, 1);
  expect(s.action).toEqual(action);
});

test('tick: idempotent on already-current state', () => {
  let s = freshState(0);
  s = tick(s, HATCH_DURATION_MS + HUNGER_INTERVAL_MS * 0.3, 1);
  const s2 = tick(s, HATCH_DURATION_MS + HUNGER_INTERVAL_MS * 0.3, 1);
  expect(s2).toEqual(s);
});

test('nextInterestingMoment: returns hatch time when egg', () => {
  const s = freshState(0);
  expect(nextInterestingMoment(s, 0, 1)).toBe(HATCH_DURATION_MS);
});

test('nextInterestingMoment: returns scaled hatch time when worldSpeed > 1', () => {
  const s = freshState(0);
  expect(nextInterestingMoment(s, 0, 100)).toBe(HATCH_DURATION_MS / 100);
});

test('nextInterestingMoment: returns next hunger tick when pet', () => {
  let s = freshState(0);
  s = tick(s, HATCH_DURATION_MS, 1);
  expect(nextInterestingMoment(s, HATCH_DURATION_MS, 1)).toBe(HATCH_DURATION_MS + HUNGER_INTERVAL_MS);
});

test('nextInterestingMoment: returns next poop time when no poop and hunger=0', () => {
  let s = freshState(0);
  s = tick(s, HATCH_DURATION_MS, 1);
  s = {...s, hunger: 0};
  expect(nextInterestingMoment(s, HATCH_DURATION_MS, 1))
    .toBe(HATCH_DURATION_MS + POOP_INTERVAL_MS);
});

test('nextInterestingMoment: returns action.until when set and earliest', () => {
  let s = freshState(0);
  s = tick(s, HATCH_DURATION_MS, 1);
  const until = HATCH_DURATION_MS + 100;
  s = {...s, action: {kind: 'feed', until}};
  expect(nextInterestingMoment(s, HATCH_DURATION_MS, 1)).toBe(until);
});
