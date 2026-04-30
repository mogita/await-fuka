import { GameState, loadOrInit, save } from './state'
import { tick } from './tick'
import { worldSpeed } from './config'

// Adaptive timeline cadence. The await widget runtime clamps `update` refresh
// intervals to a multi-minute minimum, so transient state (action / rejection)
// must be covered by pre-ticked entries within a single timeline window;
// otherwise the widget freezes on the action sprite until the next user
// interaction. Pre-mask-animation history at commit 2d0d6b1.

const TRANSIENT_CADENCE_MS = 200
const IDLE_CADENCE_MS = 1000
const ENTRIES_PER_TIMELINE = 30

export function widgetTimeline(_context: TimelineContext) {
	const now = Date.now()
	const initial = loadOrInit(now)
	const ticked = tick(initial, now, worldSpeed)
	save(ticked)

	const transientUntil = Math.max(
		ticked.action?.until ?? 0,
		ticked.rejection?.until ?? 0,
	)
	const cadence =
		transientUntil > now ? TRANSIENT_CADENCE_MS : IDLE_CADENCE_MS

	const entries: Array<{ date: Date; gameState: GameState }> = []
	for (let i = 0; i < ENTRIES_PER_TIMELINE; i++) {
		const t = now + i * cadence
		entries.push({
			date: new Date(t),
			gameState: tick(ticked, t, worldSpeed),
		})
	}

	const windowEnd = now + ENTRIES_PER_TIMELINE * cadence
	return {
		entries,
		update: new Date(windowEnd),
	}
}
