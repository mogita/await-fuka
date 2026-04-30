import { test, expect } from 'bun:test'
import {
	freshState,
	isValidStateV1,
	isValidStateV2,
	migrateV1ToV2,
} from './state'
import { HATCH_DURATION_MS, worldSpeed } from './config'

test('freshState returns egg with hunger 5', () => {
	const s = freshState(1000)
	expect(s.installedAt).toBe(1000)
	expect(s.stage).toBe('egg')
	expect(s.hunger).toBe(5)
	expect(s.hasPoop).toBe(false)
	expect(s.menuCursor).toBe('feed')
	expect(s.screen).toBe('pet')
	expect(s.action).toBeUndefined()
	expect(s.lastHungerCheckAt).toBe(1000)
	expect(s.lastPoopCheckAt).toBe(1000)
	expect(s.bornAt).toBe(1000 + HATCH_DURATION_MS / worldSpeed)
	expect(s.happiness).toBe(100)
	expect(s.weight).toBe(0.1)
	expect(s.hungerZeroSince).toBeUndefined()
	expect(s.weightLastCheckAt).toBe(1000)
	expect(s.rejection).toBeUndefined()
})

test('isValidStateV2 accepts a fresh state', () => {
	expect(isValidStateV2(freshState(0))).toBe(true)
})

test('isValidStateV2 accepts a state with action set', () => {
	const s = { ...freshState(0), action: { kind: 'feed' as const, until: 100 } }
	expect(isValidStateV2(s)).toBe(true)
})

test('isValidStateV2 accepts a state with rejection set', () => {
	const s = { ...freshState(0), rejection: { until: 100 } }
	expect(isValidStateV2(s)).toBe(true)
})

test('isValidStateV2 rejects undefined', () => {
	expect(isValidStateV2(undefined)).toBe(false)
})

test('isValidStateV2 rejects empty object', () => {
	expect(isValidStateV2({})).toBe(false)
})

test('isValidStateV2 rejects state with hunger out of bounds', () => {
	const s = { ...freshState(0), hunger: 6 }
	expect(isValidStateV2(s)).toBe(false)
})

test('isValidStateV2 rejects state with bad action shape', () => {
	const s = { ...freshState(0), action: { kind: 'sneeze', until: 100 } }
	expect(isValidStateV2(s)).toBe(false)
})

test('isValidStateV2 rejects state with bad screen', () => {
	const s = { ...freshState(0), screen: 'mainMenu' }
	expect(isValidStateV2(s)).toBe(false)
})

test('isValidStateV2 rejects v1-shaped state', () => {
	const v1 = {
		installedAt: 0,
		stage: 'pet',
		hunger: 4,
		hasPoop: false,
		lastHungerCheckAt: 0,
		lastPoopCheckAt: 0,
		menuCursor: 'none',
		action: undefined,
	}
	expect(isValidStateV2(v1)).toBe(false)
})

test('isValidStateV1 accepts an old fresh state', () => {
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

test('isValidStateV1 rejects v2-shaped state', () => {
	expect(isValidStateV1(freshState(0))).toBe(false)
})

test('migrateV1ToV2: pet at hunger>0 leaves hungerZeroSince undefined', () => {
	const v1 = {
		installedAt: 0,
		stage: 'pet' as const,
		hunger: 3,
		hasPoop: false,
		lastHungerCheckAt: 5_000_000,
		lastPoopCheckAt: 5_000_000,
		menuCursor: 'none' as const,
		action: undefined,
	}
	const v2 = migrateV1ToV2(v1, 6_000_000)
	expect(v2.hunger).toBe(3)
	expect(v2.screen).toBe('pet')
	expect(v2.menuCursor).toBe('feed')
	expect(v2.weight).toBe(0.1)
	expect(v2.happiness).toBe(100)
	expect(v2.bornAt).toBe(0 + HATCH_DURATION_MS / worldSpeed)
	expect(v2.weightLastCheckAt).toBe(6_000_000)
	expect(v2.hungerZeroSince).toBeUndefined()
})

test('migrateV1ToV2: pet at hunger=0 sets hungerZeroSince to now', () => {
	const v1 = {
		installedAt: 0,
		stage: 'pet' as const,
		hunger: 0,
		hasPoop: false,
		lastHungerCheckAt: 5_000_000,
		lastPoopCheckAt: 5_000_000,
		menuCursor: 'none' as const,
		action: undefined,
	}
	const v2 = migrateV1ToV2(v1, 6_000_000)
	expect(v2.hungerZeroSince).toBe(6_000_000)
})

test('migrateV1ToV2: egg keeps stage and bornAt projects to hatch', () => {
	const v1 = {
		installedAt: 1000,
		stage: 'egg' as const,
		hunger: 4,
		hasPoop: false,
		lastHungerCheckAt: 1000,
		lastPoopCheckAt: 1000,
		menuCursor: 'none' as const,
		action: undefined,
	}
	const v2 = migrateV1ToV2(v1, 5000)
	expect(v2.stage).toBe('egg')
	expect(v2.bornAt).toBe(1000 + HATCH_DURATION_MS / worldSpeed)
})

test('migrateV1ToV2: action and poop carry over', () => {
	const v1 = {
		installedAt: 0,
		stage: 'pet' as const,
		hunger: 2,
		hasPoop: true,
		lastHungerCheckAt: 0,
		lastPoopCheckAt: 0,
		menuCursor: 'feed' as const,
		action: { kind: 'feed' as const, until: 999 },
	}
	const v2 = migrateV1ToV2(v1, 1000)
	expect(v2.hasPoop).toBe(true)
	expect(v2.action).toEqual({ kind: 'feed', until: 999 })
})
