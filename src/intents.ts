import {GameState, MenuCursor, loadOrInit, save} from './state';
import {tick} from './tick';
import {ACTION_FEEDBACK_MS, worldSpeed} from './config';

const NEXT_CURSOR: Record<MenuCursor, MenuCursor> = {
  none: 'feed',
  feed: 'clean',
  clean: 'none',
};

export function applyCycle(state: GameState): GameState {
  if (state.stage === 'egg') return state;
  return {...state, menuCursor: NEXT_CURSOR[state.menuCursor]};
}

export function applyCancel(state: GameState): GameState {
  if (state.stage === 'egg') return state;
  if (state.menuCursor === 'none') return state;
  return {...state, menuCursor: 'none'};
}

export function applyExecute(state: GameState, now: number, ws: number): GameState {
  if (state.stage === 'egg') return state;
  if (state.action) return state;
  if (state.menuCursor === 'none') return state;

  const actionDuration = ACTION_FEEDBACK_MS / ws;

  if (state.menuCursor === 'feed') {
    if (state.hunger >= 4) return state;
    return {
      ...state,
      hunger: state.hunger + 1,
      action: {kind: 'feed', until: now + actionDuration},
    };
  }

  if (state.menuCursor === 'clean') {
    if (!state.hasPoop) return state;
    return {
      ...state,
      hasPoop: false,
      lastPoopCheckAt: now,
      action: {kind: 'clean', until: now + actionDuration},
    };
  }

  return state;
}

// Side-effectful wrappers exposed as widget intents.
// Each follows: load -> tick -> apply -> save.

export function cycle(): void {
  const now = Date.now();
  let s = loadOrInit(now);
  s = tick(s, now, worldSpeed);
  s = applyCycle(s);
  save(s);
}

export function execute(): void {
  const now = Date.now();
  let s = loadOrInit(now);
  s = tick(s, now, worldSpeed);
  s = applyExecute(s, now, worldSpeed);
  save(s);
}

export function cancel(): void {
  const now = Date.now();
  let s = loadOrInit(now);
  s = tick(s, now, worldSpeed);
  s = applyCancel(s);
  save(s);
}
