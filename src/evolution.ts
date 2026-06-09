import { BodyArchetype, GameState } from './state'

const BODIES: readonly BodyArchetype[] = [
	'roly-poly',
	'lanky-blob',
	'lean-spike',
	'stout-rock',
]

export function bodyFromSeed(seed: number): BodyArchetype {
	return BODIES[seed % BODIES.length]!
}

export function applyAdulthoodSnapshot(s: GameState): GameState {
	// The body is the pet's innate, seed-derived identity, locked in at
	// adulthood. The face mood is derived live from happiness when rendering,
	// so nothing else is captured here.
	return {
		...s,
		stage: 'adult',
		adultBody: bodyFromSeed(s.bornSeed),
	}
}
