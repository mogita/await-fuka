import {
	ACTION_FEEDBACK_MS,
	HAPPINESS_CLEAN_BONUS,
	HAPPINESS_FEED_BONUS,
	HUNGER_MAX,
	MASK_CYCLE_MS,
	REJECTION_FEEDBACK_MS,
	WEIGHT_CAP,
	WEIGHT_GROWTH_FRACTION,
	worldSpeed,
} from './config'
import { GameState, loadOrInit, MenuCursor, save } from './state'
import { tick } from './tick'

function alignToMaskCycle(t: number): number {
	return Math.ceil(t / MASK_CYCLE_MS) * MASK_CYCLE_MS
}

const NEXT_CURSOR: Record<MenuCursor, MenuCursor> = {
	feed: 'clean',
	clean: 'stats',
	stats: 'feed',
}

export function applyCycle(state: GameState): GameState {
	if (state.stage === 'egg') return state
	if (state.screen === 'pet') {
		return { ...state, screen: 'menu', menuCursor: 'feed' }
	}
	if (state.screen === 'menu') {
		return { ...state, menuCursor: NEXT_CURSOR[state.menuCursor] }
	}
	return state
}

export function applyCancel(state: GameState): GameState {
	if (state.stage === 'egg') return state
	if (state.screen === 'menu' || state.screen === 'stats') {
		return { ...state, screen: 'pet' }
	}
	return state
}

export function applyExecute(
	state: GameState,
	now: number,
	ws: number,
): GameState {
	if (state.stage === 'egg') return state
	if (state.screen !== 'menu') return state

	const actionUntil = alignToMaskCycle(now + ACTION_FEEDBACK_MS / ws)
	const rejectionUntil = alignToMaskCycle(now + REJECTION_FEEDBACK_MS / ws)

	if (state.menuCursor === 'feed') {
		// A valid feed always registers, even while the eat animation from a
		// previous tap is still playing: the new feed just restarts it. Gating
		// on action !== undefined here silently dropped rapid taps (#6).
		const canFeed = !state.hasPoop && state.hunger < HUNGER_MAX
		if (canFeed) {
			const newWeight = Math.min(
				WEIGHT_CAP,
				state.weight + (WEIGHT_CAP - state.weight) * WEIGHT_GROWTH_FRACTION,
			)
			return {
				...state,
				screen: 'pet',
				hunger: state.hunger + 1,
				weight: newWeight,
				happiness: Math.min(100, state.happiness + HAPPINESS_FEED_BONUS),
				totalFeedCount: state.totalFeedCount + 1,
				action: { kind: 'feed', until: actionUntil },
				rejection: undefined,
			}
		}
		// Refused: stomach full, or won't eat in a dirty home (clean first).
		// Hold the head-shake while an animation is still playing so the pet
		// isn't yanked mid-animation; otherwise show the refusal.
		if (state.action !== undefined) {
			return { ...state, screen: 'pet' }
		}
		return { ...state, screen: 'pet', rejection: { until: rejectionUntil } }
	}

	if (state.menuCursor === 'clean') {
		// Cleaning registers whenever there is poop, even while an animation
		// from a previous tap is still playing (#6). Nothing to clean -> quiet.
		if (!state.hasPoop) {
			return { ...state, screen: 'pet' }
		}
		return {
			...state,
			screen: 'pet',
			hasPoop: false,
			lastPoopCheckAt: now,
			happiness: Math.min(100, state.happiness + HAPPINESS_CLEAN_BONUS),
			action: { kind: 'clean', until: actionUntil },
			rejection: undefined,
		}
	}

	if (state.menuCursor === 'stats') {
		return { ...state, screen: 'stats' }
	}

	return state
}

// Side-effectful wrappers exposed as widget intents.
// Each follows: load -> tick -> apply -> save.

export function cycle(): void {
	const now = Date.now()
	let s = loadOrInit(now)
	s = tick(s, now, worldSpeed)
	s = applyCycle(s)
	save(s)
}

export function execute(): void {
	const now = Date.now()
	let s = loadOrInit(now)
	s = tick(s, now, worldSpeed)
	s = applyExecute(s, now, worldSpeed)
	save(s)
}

export function cancel(): void {
	const now = Date.now()
	let s = loadOrInit(now)
	s = tick(s, now, worldSpeed)
	s = applyCancel(s)
	save(s)
}
