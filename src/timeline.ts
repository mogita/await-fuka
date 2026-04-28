import {loadOrInit, save, GameState} from './state';
import {tick, nextInterestingMoment} from './tick';
import {worldSpeed} from './config';

// Pre-compute many evenly spaced timeline entries so the runtime can advance
// the displayed frame without re-fetching the timeline. NUM_FRAMES * INTERVAL
// = the wall-clock window covered by one timeline call.
const FRAME_INTERVAL_MS = 250;
const NUM_FRAMES = 60;

export function widgetTimeline(_context: TimelineContext) {
  const now = Date.now();
  const initialState = loadOrInit(now);
  const tickedNow = tick(initialState, now, worldSpeed);
  save(tickedNow);

  const entries: Array<{date: Date; gameState: GameState}> = [];
  for (let i = 0; i < NUM_FRAMES; i++) {
    const frameTime = now + i * FRAME_INTERVAL_MS;
    const frameState = tick(tickedNow, frameTime, worldSpeed);
    entries.push({date: new Date(frameTime), gameState: frameState});
  }

  // Refresh either right after the last pre-computed frame, or earlier if some
  // game-state event (hatch, hunger drop, action expiry) lands inside the
  // window. The runtime will re-call this function and we'll re-load state.
  const lastFrameTime = now + (NUM_FRAMES - 1) * FRAME_INTERVAL_MS;
  const next = nextInterestingMoment(tickedNow, now, worldSpeed);
  const refreshAt = Math.min(lastFrameTime + FRAME_INTERVAL_MS, next);

  return {
    entries,
    update: new Date(refreshAt),
  };
}
