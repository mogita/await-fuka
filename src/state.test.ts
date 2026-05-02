import { test, expect } from 'bun:test'
import {
	freshState,
	isValidStateV1,
	isValidStateV2,
	isValidStateV3,
	migrateV1ToV2,
	migrateV2ToV3,
} from './state'
import { HATCH_DURATION_MS, worldSpeed } from './config'

const fixedSeed = () => 0.5

test('freshState v3 returns egg with all evolution fields', () => {
	const s = freshState(1000, fixedSeed)
	expect(s.installedAt).toBe(1000)
	expect(s.stage).toBe('egg')
	expect(s.hunger).toBe(5)
	expect(s.menuCursor).toBe('feed')
	expect(s.screen).toBe('pet')
	expect(s.bornAt).toBe(1000 + HATCH_DURATION_MS / worldSpeed)
	expect(s.happiness).toBe(100)
	expect(s.weight).toBe(0.1)
	expect(s.bornSeed).toBe(Math.floor(0.5 * 2147483647))
	expect(s.adultBody).toBeUndefined()
	expect(s.adultFace).toBeUndefined()
	expect(s.adultHead).toBeUndefined()
	expect(s.adultBack).toBeUndefined()
	expect(s.lastHappinessCheckAt).toBe(1000)
	expect(s.cumulativeHungerZeroMs).toBe(0)
	expect(s.cumulativeUncleanedPoopMs).toBe(0)
	expect(s.totalFeedCount).toBe(0)
	expect(s.lifetimeHappinessSum).toBe(0)
	expect(s.lifetimeHappinessSamples).toBe(0)
})

test('isValidStateV3 accepts a fresh state', () => {
	expect(isValidStateV3(freshState(0, fixedSeed))).toBe(true)
})

test('isValidStateV3 accepts an adult state with all adult fields populated', () => {
	const s = {
		...freshState(0, fixedSeed),
		stage: 'adult' as const,
		adultBody: 'roly-poly' as const,
		adultFace: 'cheerful' as const,
		adultHead: 'halo' as const,
		adultBack: 'feathered' as const,
	}
	expect(isValidStateV3(s)).toBe(true)
})

test('isValidStateV3 rejects v2-shaped state', () => {
	const v2 = {
		installedAt: 0,
		stage: 'pet',
		hunger: 5,
		hasPoop: false,
		lastHungerCheckAt: 0,
		lastPoopCheckAt: 0,
		action: undefined,
		screen: 'pet',
		menuCursor: 'feed',
		bornAt: 30000,
		happiness: 100,
		weight: 0.1,
		hungerZeroSince: undefined,
		weightLastCheckAt: 0,
		rejection: undefined,
	}
	expect(isValidStateV3(v2)).toBe(false)
})

test('isValidStateV3 rejects state with bad adultBody', () => {
	const s = { ...freshState(0, fixedSeed), adultBody: 'wrong' }
	expect(isValidStateV3(s)).toBe(false)
})

test('isValidStateV2 accepts an old v2 state', () => {
	const v2 = {
		installedAt: 0,
		stage: 'pet',
		hunger: 5,
		hasPoop: false,
		lastHungerCheckAt: 0,
		lastPoopCheckAt: 0,
		action: undefined,
		screen: 'pet',
		menuCursor: 'feed',
		bornAt: 30000,
		happiness: 100,
		weight: 0.1,
		hungerZeroSince: undefined,
		weightLastCheckAt: 0,
		rejection: undefined,
	}
	expect(isValidStateV2(v2)).toBe(true)
})

test('isValidStateV2 rejects v3-shaped state', () => {
	expect(isValidStateV2(freshState(0, fixedSeed))).toBe(false)
})

test('isValidStateV1 accepts a v1 state', () => {
	const v1 = {
		installedAt: 0,
		stage: 'egg',
		hunger: 4,
		hasPoop: false,
		lastHungerCheckAt: 0,
		lastPoopCheckAt: 0,
		menuCursor: 'none',
		action: undefined,
	}
	expect(isValidStateV1(v1)).toBe(true)
})

test('migrateV2ToV3: pet stage becomes youth', () => {
	const v2 = {
		installedAt: 0,
		stage: 'pet' as const,
		hunger: 3,
		hasPoop: false,
		lastHungerCheckAt: 5_000_000,
		lastPoopCheckAt: 5_000_000,
		action: undefined,
		screen: 'pet' as const,
		menuCursor: 'feed' as const,
		bornAt: 30000,
		happiness: 80,
		weight: 5,
		hungerZeroSince: undefined,
		weightLastCheckAt: 5_000_000,
		rejection: undefined,
	}
	const v3 = migrateV2ToV3(v2, 6_000_000, fixedSeed)
	expect(v3.stage).toBe('youth')
	expect(v3.bornSeed).toBe(Math.floor(0.5 * 2147483647))
	expect(v3.lastHappinessCheckAt).toBe(6_000_000)
	expect(v3.cumulativeHungerZeroMs).toBe(0)
	expect(v3.totalFeedCount).toBe(0)
	expect(v3.adultBody).toBeUndefined()
	expect(v3.happiness).toBe(80) // preserved
	expect(v3.weight).toBe(5) // preserved
})

test('migrateV2ToV3: egg stage stays egg', () => {
	const v2 = {
		installedAt: 0,
		stage: 'egg' as const,
		hunger: 5,
		hasPoop: false,
		lastHungerCheckAt: 0,
		lastPoopCheckAt: 0,
		action: undefined,
		screen: 'pet' as const,
		menuCursor: 'feed' as const,
		bornAt: 30000,
		happiness: 100,
		weight: 0.1,
		hungerZeroSince: undefined,
		weightLastCheckAt: 0,
		rejection: undefined,
	}
	const v3 = migrateV2ToV3(v2, 1000, fixedSeed)
	expect(v3.stage).toBe('egg')
})

test('migrateV1ToV2 still works as a v2 builder', () => {
	const v1 = {
		installedAt: 1000,
		stage: 'pet' as const,
		hunger: 4,
		hasPoop: false,
		lastHungerCheckAt: 1000,
		lastPoopCheckAt: 1000,
		menuCursor: 'none' as const,
		action: undefined,
	}
	const v2 = migrateV1ToV2(v1, 5000)
	expect(v2.stage).toBe('pet')
	expect(v2.bornAt).toBe(1000 + HATCH_DURATION_MS / worldSpeed)
	expect(v2.happiness).toBe(100)
	expect(v2.weight).toBe(0.1)
})
