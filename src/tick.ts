import { GameState } from './state'
import { applyAdulthoodSnapshot } from './evolution'
import {
	ADULT_DURATION_MS,
	ADULT_WEIGHT,
	HAPPINESS_DECAY_PER_HR,
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
				stage: 'youth',
				bornAt: hatchAt,
				lastHungerCheckAt: hatchAt,
				lastPoopCheckAt: hatchAt,
				weightLastCheckAt: hatchAt,
				lastHappinessCheckAt: hatchAt,
			}
		}
	}

	if (s.stage === 'youth' || s.stage === 'adult') {
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

		// Hourly metric pass (youth only; adult freezes happiness/metrics).
		if (s.stage === 'youth') {
			const happinessInterval = HUNGER_INTERVAL_MS / worldSpeed
			const happinessBoundaries = Math.max(
				0,
				Math.floor((now - s.lastHappinessCheckAt) / happinessInterval),
			)
			if (happinessBoundaries > 0) {
				let happiness = s.happiness
				let sum = s.lifetimeHappinessSum
				let samples = s.lifetimeHappinessSamples
				let cumHungerZero = s.cumulativeHungerZeroMs
				let cumPoop = s.cumulativeUncleanedPoopMs
				const hadPoop = s.hasPoop
				for (let i = 0; i < happinessBoundaries; i++) {
					happiness = Math.max(0, happiness - HAPPINESS_DECAY_PER_HR)
					sum += happiness
					samples += 1
					if (s.hunger === 0) cumHungerZero += happinessInterval
					if (hadPoop) cumPoop += happinessInterval
				}
				s = {
					...s,
					happiness,
					lifetimeHappinessSum: sum,
					lifetimeHappinessSamples: samples,
					cumulativeHungerZeroMs: cumHungerZero,
					cumulativeUncleanedPoopMs: cumPoop,
					lastHappinessCheckAt:
						s.lastHappinessCheckAt + happinessBoundaries * happinessInterval,
				}
			}
		}

		// Adulthood transition (after hourly metrics so the snapshot includes the
		// most recent happiness sample).
		if (s.stage === 'youth') {
			const adultAt = s.bornAt + ADULT_DURATION_MS / worldSpeed
			if (now >= adultAt) {
				s = applyAdulthoodSnapshot(s, now, worldSpeed)
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
		if (state.stage === 'youth') {
			candidates.push(
				state.lastHappinessCheckAt + HUNGER_INTERVAL_MS / worldSpeed,
			)
			candidates.push(state.bornAt + ADULT_DURATION_MS / worldSpeed)
		}
	}

	if (state.action) candidates.push(state.action.until)
	if (state.rejection) candidates.push(state.rejection.until)

	if (candidates.length === 0) {
		return now + 60 * 60 * 1000
	}
	return Math.min(...candidates)
}
