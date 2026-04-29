import {loadOrInit, save, GameState} from './state';
import {tick, nextInterestingMoment} from './tick';
import {worldSpeed} from './config';

// Cadence at which timeline entries are spaced. The runtime renders one entry
// per date; finer cadence = smoother animation but a shorter window before the
// timeline must be re-fetched. Adaptive: tight while an action animation is
// playing (eating cycles at 200ms so we want at least that), loose otherwise
// (idle/hungry/happy cycle at 400-1000ms; we don't need finer than 1s).
const ACTION_CADENCE_MS = 200;
const IDLE_CADENCE_MS = 1000;
// 30 entries gives 30s of idle (1000ms cadence) or 6s of action (200ms
// cadence). With image-based rendering view count is so low we could go
// higher, but the home-screen pre-render budget is the gating constraint, so
// we stay conservative.
const NUM_FRAMES = 30;

export function widgetTimeline(_context: TimelineContext) {
  const now = Date.now();
  const initialState = loadOrInit(now);
  const tickedNow = tick(initialState, now, worldSpeed);
  save(tickedNow);

  const cadence = tickedNow.action ? ACTION_CADENCE_MS : IDLE_CADENCE_MS;

  const entries: Array<{date: Date; gameState: GameState}> = [];
  for (let i = 0; i < NUM_FRAMES; i++) {
    const frameTime = now + i * cadence;
    const frameState = tick(tickedNow, frameTime, worldSpeed);
    entries.push({date: new Date(frameTime), gameState: frameState});
  }

  // Refresh either right after the last pre-computed frame, or earlier if some
  // game-state event (hatch, hunger drop, action expiry) lands inside the
  // window. The runtime will re-call this function and we'll re-load state.
  const lastFrameTime = now + (NUM_FRAMES - 1) * cadence;
  const next = nextInterestingMoment(tickedNow, now, worldSpeed);
  const refreshAt = Math.min(lastFrameTime + cadence, next);

  return {
    entries,
    update: new Date(refreshAt),
  };
}
