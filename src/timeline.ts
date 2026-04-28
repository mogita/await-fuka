import {loadOrInit, save} from './state';
import {tick, nextInterestingMoment} from './tick';
import {worldSpeed} from './config';

export function widgetTimeline(_context: TimelineContext) {
  const now = Date.now();
  let state = loadOrInit(now);
  state = tick(state, now, worldSpeed);
  save(state);
  const next = nextInterestingMoment(state, now, worldSpeed);

  return {
    entries: [{date: new Date(now), gameState: state}],
    update: new Date(next),
  };
}
