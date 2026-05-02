import { test, expect } from 'bun:test'
import {
	bodyFromSeed,
	faceFromSeed,
	headFromCare,
	backFromCare,
	applyAdulthoodSnapshot,
} from './evolution'
import { freshState } from './state'

const fixedSeed = () => 0.5

test('bodyFromSeed: deterministic for same seed', () => {
	expect(bodyFromSeed(0)).toBe(bodyFromSeed(0))
	expect(bodyFromSeed(7)).toBe(bodyFromSeed(7))
})

test('bodyFromSeed: covers all 4 archetypes across small seed range', () => {
	const set = new Set<string>()
	for (let i = 0; i < 100; i++) set.add(bodyFromSeed(i))
	expect(set.size).toBe(4)
})

test('faceFromSeed: deterministic and covers all 6 personalities', () => {
	expect(faceFromSeed(0)).toBe(faceFromSeed(0))
	const set = new Set<string>()
	for (let i = 0; i < 200; i++) set.add(faceFromSeed(i))
	expect(set.size).toBe(6)
})

test('headFromCare: halo when no hunger zero and avg happiness >= 90', () => {
	expect(headFromCare({ avgHappiness: 95, cumulativeHungerZeroMs: 0, cumulativeUncleanedPoopMs: 0, weight: 10 }, 1)).toBe('halo')
})

test('headFromCare: horns when cumulative hunger zero >= 24h', () => {
	expect(headFromCare({ avgHappiness: 50, cumulativeHungerZeroMs: 24 * 60 * 60 * 1000, cumulativeUncleanedPoopMs: 0, weight: 10 }, 1)).toBe('horns')
})

test('headFromCare: crown when weight >= 40 and avg happiness >= 80', () => {
	expect(headFromCare({ avgHappiness: 85, cumulativeHungerZeroMs: 1000, cumulativeUncleanedPoopMs: 0, weight: 45 }, 1)).toBe('crown')
})

test('headFromCare: plant when uncleaned poop >= 24h', () => {
	expect(headFromCare({ avgHappiness: 50, cumulativeHungerZeroMs: 1000, cumulativeUncleanedPoopMs: 24 * 60 * 60 * 1000, weight: 10 }, 1)).toBe('plant')
})

test('headFromCare: bare otherwise', () => {
	expect(headFromCare({ avgHappiness: 50, cumulativeHungerZeroMs: 1000, cumulativeUncleanedPoopMs: 0, weight: 10 }, 1)).toBe('bare')
})

test('headFromCare: priority order (halo wins over crown when both qualify)', () => {
	expect(headFromCare({ avgHappiness: 95, cumulativeHungerZeroMs: 0, cumulativeUncleanedPoopMs: 0, weight: 45 }, 1)).toBe('halo')
})

test('backFromCare: feathered when avg happiness >= 70', () => {
	expect(backFromCare({ avgHappiness: 75, totalFeedCount: 10 })).toBe('feathered')
})

test('backFromCare: bat when avg happiness < 40', () => {
	expect(backFromCare({ avgHappiness: 30, totalFeedCount: 10 })).toBe('bat')
})

test('backFromCare: insect when totalFeedCount >= 50', () => {
	expect(backFromCare({ avgHappiness: 50, totalFeedCount: 60 })).toBe('insect')
})

test('backFromCare: bare otherwise', () => {
	expect(backFromCare({ avgHappiness: 50, totalFeedCount: 10 })).toBe('bare')
})

test('applyAdulthoodSnapshot: sets stage adult and all four adult fields', () => {
	const s = {
		...freshState(0, fixedSeed),
		stage: 'youth' as const,
		weight: 45,
		lifetimeHappinessSum: 950,
		lifetimeHappinessSamples: 10,
		cumulativeHungerZeroMs: 0,
		totalFeedCount: 60,
	}
	const r = applyAdulthoodSnapshot(s, 1000, 1)
	expect(r.stage).toBe('adult')
	expect(r.adultBody).toBeDefined()
	expect(r.adultFace).toBeDefined()
	expect(r.adultHead).toBe('halo')
	expect(r.adultBack).toBe('feathered')
})

test('applyAdulthoodSnapshot: avg happiness 0 when no samples', () => {
	const s = {
		...freshState(0, fixedSeed),
		stage: 'youth' as const,
		lifetimeHappinessSamples: 0,
		lifetimeHappinessSum: 0,
	}
	const r = applyAdulthoodSnapshot(s, 1000, 1)
	expect(r.adultHead).toBe('bare')
	expect(r.adultBack).toBe('bare')
})
