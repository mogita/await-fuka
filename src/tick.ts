import {GameState} from './state';
import {HATCH_DURATION_MS, HUNGER_INTERVAL_MS, POOP_INTERVAL_MS} from './config';

export function tick(state: GameState, now: number, worldSpeed: number): GameState {
  let s = state;

  if (s.stage === 'egg') {
    const hatchAt = s.installedAt + HATCH_DURATION_MS / worldSpeed;
    if (now >= hatchAt) {
      s = {
        ...s,
        stage: 'pet',
        lastHungerCheckAt: now,
        lastPoopCheckAt: now,
      };
    }
  }

  if (s.stage === 'pet') {
    const hungerInterval = HUNGER_INTERVAL_MS / worldSpeed;
    const hungerTicks = Math.max(0, Math.floor((now - s.lastHungerCheckAt) / hungerInterval));
    if (hungerTicks > 0) {
      s = {
        ...s,
        hunger: Math.max(0, s.hunger - hungerTicks),
        lastHungerCheckAt: s.lastHungerCheckAt + hungerTicks * hungerInterval,
      };
    }

    if (!s.hasPoop) {
      const poopInterval = POOP_INTERVAL_MS / worldSpeed;
      if (now - s.lastPoopCheckAt >= poopInterval) {
        s = {...s, hasPoop: true, lastPoopCheckAt: now};
      }
    }
  }

  if (s.action && now >= s.action.until) {
    s = {...s, action: undefined};
  }

  return s;
}

export function nextInterestingMoment(state: GameState, now: number, worldSpeed: number): number {
  const candidates: number[] = [];

  if (state.stage === 'egg') {
    candidates.push(state.installedAt + HATCH_DURATION_MS / worldSpeed);
  } else {
    if (state.hunger > 0) {
      candidates.push(state.lastHungerCheckAt + HUNGER_INTERVAL_MS / worldSpeed);
    }
    if (!state.hasPoop) {
      candidates.push(state.lastPoopCheckAt + POOP_INTERVAL_MS / worldSpeed);
    }
  }

  if (state.action) {
    candidates.push(state.action.until);
  }

  if (candidates.length === 0) {
    return now + 60 * 60 * 1000; // arbitrary far-future fallback (1h)
  }
  return Math.min(...candidates);
}
