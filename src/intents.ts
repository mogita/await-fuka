import { GameState, MenuCursor, loadOrInit, save } from './state'
import { tick } from './tick'
import {
	ACTION_FEEDBACK_MS,
	HUNGER_MAX,
	MASK_CYCLE_MS,
	REJECTION_FEEDBACK_MS,
	WEIGHT_CAP,
	WEIGHT_GROWTH_FRACTION,
	worldSpeed,
} from './config'

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
		const blocked = state.action !== undefined || state.hunger >= HUNGER_MAX
		if (blocked) {
			return {
				...state,
				screen: 'pet',
				rejection: { until: rejectionUntil },
			}
		}
		const newWeight = Math.min(
			WEIGHT_CAP,
			state.weight + (WEIGHT_CAP - state.weight) * WEIGHT_GROWTH_FRACTION,
		)
		return {
			...state,
			screen: 'pet',
			hunger: state.hunger + 1,
			weight: newWeight,
			action: { kind: 'feed', until: actionUntil },
		}
	}

	if (state.menuCursor === 'clean') {
		const canClean = state.action === undefined && state.hasPoop
		if (!canClean) {
			return { ...state, screen: 'pet' }
		}
		return {
			...state,
			screen: 'pet',
			hasPoop: false,
			lastPoopCheckAt: now,
			action: { kind: 'clean', until: actionUntil },
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
