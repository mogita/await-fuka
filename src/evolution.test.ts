import { expect, test } from 'bun:test'
import { applyAdulthoodSnapshot, bodyFromSeed } from './evolution'
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

test('applyAdulthoodSnapshot: sets stage adult and snapshots the seed body', () => {
	const s = {
		...freshState(0, fixedSeed),
		stage: 'youth' as const,
		weight: 45,
		totalFeedCount: 60,
	}
	const r = applyAdulthoodSnapshot(s)
	expect(r.stage).toBe('adult')
	expect(r.adultBody).toBe(bodyFromSeed(s.bornSeed))
})

test('applyAdulthoodSnapshot: leaves happiness and seed untouched (face stays live)', () => {
	const s = {
		...freshState(0, fixedSeed),
		stage: 'youth' as const,
		happiness: 42,
	}
	const r = applyAdulthoodSnapshot(s)
	expect(r.happiness).toBe(42)
	expect(r.bornSeed).toBe(s.bornSeed)
})
