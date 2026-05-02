import {
	ADULT_BAT_HAPPINESS_MAX,
	ADULT_CROWN_HAPPINESS_MIN,
	ADULT_CROWN_WEIGHT_MIN,
	ADULT_FEATHERED_HAPPINESS_MIN,
	ADULT_HALO_HAPPINESS_MIN,
	ADULT_HORNS_HUNGER_ZERO_MIN_MS,
	ADULT_INSECT_FEED_MIN,
	ADULT_PLANT_POOP_MIN_MS,
} from './config'
import {
	BackAttachment,
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
		care.cumulativeHungerZeroMs >=
		ADULT_HORNS_HUNGER_ZERO_MIN_MS / worldSpeed
	)
		return 'horns'
	if (
		care.weight >= ADULT_CROWN_WEIGHT_MIN &&
		care.avgHappiness >= ADULT_CROWN_HAPPINESS_MIN
	)
		return 'crown'
	if (care.cumulativeUncleanedPoopMs >= ADULT_PLANT_POOP_MIN_MS / worldSpeed)
		return 'plant'
	return 'bare'
}

export type BackCareInput = {
	avgHappiness: number
	totalFeedCount: number
}

export function backFromCare(care: BackCareInput): BackAttachment {
	if (care.avgHappiness >= ADULT_FEATHERED_HAPPINESS_MIN) return 'feathered'
	if (care.avgHappiness > 0 && care.avgHappiness < ADULT_BAT_HAPPINESS_MAX)
		return 'bat'
	if (care.totalFeedCount >= ADULT_INSECT_FEED_MIN) return 'insect'
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
		adultBack: backFromCare({
			avgHappiness,
			totalFeedCount: s.totalFeedCount,
		}),
	}
}
