import { loadOrInit, save, GameState } from "./state";
import { tick, nextInterestingMoment } from "./tick";
import { worldSpeed } from "./config";

// Mask-driven sprite cycling (via the Widget font's fs02/fs04 features) means
// the runtime advances animation frames natively from wall-clock phase. The
// timeline only needs to refresh on actual state transitions (hatch, hunger
// drop, action expiry, poop appear) which nextInterestingMoment returns. One
// entry per render is enough; the runtime re-fetches at `update`.

export function widgetTimeline(_context: TimelineContext) {
	const now = Date.now();
	const initial = loadOrInit(now);
	const ticked = tick(initial, now, worldSpeed);
	save(ticked);

	const next = nextInterestingMoment(ticked, now, worldSpeed);

	const entries: Array<{ date: Date; gameState: GameState }> = [
		{ date: new Date(now), gameState: ticked },
	];

	return {
		entries,
		update: new Date(next),
	};
}
