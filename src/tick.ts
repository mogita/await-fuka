import { GameState } from './state'
import {
	ADULT_WEIGHT,
	HATCH_DURATION_MS,
	HUNGER_INTERVAL_MS,
	MAX_WEIGHT_LOSS_PER_HR,
	POOP_INTERVAL_MS,
	WEIGHT_FLOOR,
} from './config'

export function tick(
	state: GameState,
	now: number,
	worldSpeed: number,
): GameState {
	let s = state

	if (s.stage === 'egg') {
		const hatchAt = s.installedAt + HATCH_DURATION_MS / worldSpeed
		if (now >= hatchAt) {
			s = {
				...s,
				stage: 'pet',
				bornAt: hatchAt,
				lastHungerCheckAt: hatchAt,
				lastPoopCheckAt: hatchAt,
				weightLastCheckAt: hatchAt,
			}
		}
	}

	if (s.stage === 'pet') {
		const hungerInterval = HUNGER_INTERVAL_MS / worldSpeed
		const hungerTicks = Math.max(
			0,
			Math.floor((now - s.lastHungerCheckAt) / hungerInterval),
		)
		if (hungerTicks > 0) {
			s = {
				...s,
				hunger: Math.max(0, s.hunger - hungerTicks),
				lastHungerCheckAt: s.lastHungerCheckAt + hungerTicks * hungerInterval,
			}
		}

		if (s.hunger === 0 && s.hungerZeroSince === undefined) {
			s = {
				...s,
				hungerZeroSince: s.lastHungerCheckAt,
				weightLastCheckAt: s.lastHungerCheckAt,
			}
		} else if (s.hunger > 0 && s.hungerZeroSince !== undefined) {
			s = { ...s, hungerZeroSince: undefined }
		}

		if (s.hungerZeroSince !== undefined) {
			const weightInterval = hungerInterval
			const boundaries = Math.max(
				0,
				Math.floor((now - s.weightLastCheckAt) / weightInterval),
			)
			if (boundaries > 0) {
				let w = s.weight
				let checkAt = s.weightLastCheckAt
				for (let i = 0; i < boundaries; i++) {
					checkAt += weightInterval
					const hoursAtZero = (checkAt - s.hungerZeroSince) / weightInterval
					const timeRamp = 1 - Math.exp(-hoursAtZero / 24)
					const sizeFactor = Math.min(1, w / ADULT_WEIGHT)
					const delta = MAX_WEIGHT_LOSS_PER_HR * timeRamp * sizeFactor
					w = Math.max(WEIGHT_FLOOR, w - delta)
				}
				s = { ...s, weight: w, weightLastCheckAt: checkAt }
			}
		}

		if (!s.hasPoop) {
			const poopInterval = POOP_INTERVAL_MS / worldSpeed
			if (now - s.lastPoopCheckAt >= poopInterval) {
				s = { ...s, hasPoop: true, lastPoopCheckAt: now }
			}
		}
	}

	if (s.action && now >= s.action.until) {
		s = { ...s, action: undefined }
	}

	if (s.rejection && now >= s.rejection.until) {
		s = { ...s, rejection: undefined }
	}

	return s
}

export function nextInterestingMoment(
	state: GameState,
	now: number,
	worldSpeed: number,
): number {
	const candidates: number[] = []

	if (state.stage === 'egg') {
		candidates.push(state.installedAt + HATCH_DURATION_MS / worldSpeed)
	} else {
		if (state.hunger > 0) {
			candidates.push(state.lastHungerCheckAt + HUNGER_INTERVAL_MS / worldSpeed)
		}
		if (!state.hasPoop) {
			candidates.push(state.lastPoopCheckAt + POOP_INTERVAL_MS / worldSpeed)
		}
		if (state.hungerZeroSince !== undefined) {
			candidates.push(state.weightLastCheckAt + HUNGER_INTERVAL_MS / worldSpeed)
		}
	}

	if (state.action) candidates.push(state.action.until)
	if (state.rejection) candidates.push(state.rejection.until)

	if (candidates.length === 0) {
		return now + 60 * 60 * 1000
	}
	return Math.min(...candidates)
}
