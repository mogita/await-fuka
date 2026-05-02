import {
	ADULT_CROWN_HAPPINESS_MIN,
	ADULT_CROWN_WEIGHT_MIN,
	ADULT_HALO_HAPPINESS_MIN,
	ADULT_PLANT_POOP_MIN_MS,
} from './config'
import {
	BodyArchetype,
	FacePersonality,
	GameState,
	HeadAttachment,
} from './state'

const BODIES: readonly BodyArchetype[] = [
	'roly-poly',
	'lanky-blob',
	'lean-spike',
	'stout-rock',
]
const FACES: readonly FacePersonality[] = [
	'cheerful',
	'sleepy',
	'sly',
	'innocent',
	'grumpy',
	'wise',
]

export function bodyFromSeed(seed: number): BodyArchetype {
	return BODIES[seed % BODIES.length]!
}

export function faceFromSeed(seed: number): FacePersonality {
	return FACES[Math.floor(seed / BODIES.length) % FACES.length]!
}

export type HeadCareInput = {
	avgHappiness: number
	cumulativeHungerZeroMs: number
	cumulativeUncleanedPoopMs: number
	weight: number
}

export function headFromCare(
	care: HeadCareInput,
	worldSpeed: number,
): HeadAttachment {
	if (
		care.cumulativeHungerZeroMs === 0 &&
		care.avgHappiness >= ADULT_HALO_HAPPINESS_MIN
	)
		return 'halo'
	if (
		care.weight >= ADULT_CROWN_WEIGHT_MIN &&
		care.avgHappiness >= ADULT_CROWN_HAPPINESS_MIN
	)
		return 'crown'
	if (care.cumulativeUncleanedPoopMs >= ADULT_PLANT_POOP_MIN_MS / worldSpeed)
		return 'plant'
	return 'bare'
}

export function applyAdulthoodSnapshot(
	s: GameState,
	now: number,
	worldSpeed: number,
): GameState {
	const avgHappiness =
		s.lifetimeHappinessSamples > 0
			? s.lifetimeHappinessSum / s.lifetimeHappinessSamples
			: 0
	return {
		...s,
		stage: 'adult',
		adultBody: bodyFromSeed(s.bornSeed),
		adultFace: faceFromSeed(s.bornSeed),
		adultHead: headFromCare(
			{
				avgHappiness,
				cumulativeHungerZeroMs: s.cumulativeHungerZeroMs,
				cumulativeUncleanedPoopMs: s.cumulativeUncleanedPoopMs,
				weight: s.weight,
			},
			worldSpeed,
		),
	}
}
