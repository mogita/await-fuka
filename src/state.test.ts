import { expect, test } from 'bun:test'
import { HATCH_DURATION_MS, worldSpeed } from './config'
import {
	freshState,
	isValidStateV1,
	isValidStateV2,
	isValidStateV3,
	isValidStateV4,
	loadOrInit,
	migrateV1ToV2,
	migrateV2ToV3,
	migrateV3ToV4,
} from './state'
import { tick } from './tick'

const fixedSeed = () => 0.5

// Internal migration shapes, referenced via the migrate function signatures so
// the fixtures stay typed without exporting the legacy types.
type V3 = Parameters<typeof migrateV3ToV4>[0]
type V2 = Parameters<typeof migrateV2ToV3>[0]

function v3Fixture(overrides: Partial<V3> = {}): V3 {
	return {
		installedAt: 0,
		stage: 'youth',
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
		bornSeed: 123,
		adultBody: undefined,
		adultFace: undefined,
		adultHead: undefined,
		adultBack: undefined,
		lastHappinessCheckAt: 0,
		cumulativeHungerZeroMs: 0,
		cumulativeUncleanedPoopMs: 0,
		totalFeedCount: 0,
		lifetimeHappinessSum: 0,
		lifetimeHappinessSamples: 0,
		...overrides,
	}
}

function v2Fixture(overrides: Partial<V2> = {}): V2 {
	return {
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
		...overrides,
	}
}

test('freshState returns a v4 egg with body+seed, without attachment/metric fields', () => {
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
	expect(s.lastHappinessCheckAt).toBe(1000)
	expect(s.totalFeedCount).toBe(0)
	expect('adultFace' in s).toBe(false)
	expect('adultHead' in s).toBe(false)
	expect('adultBack' in s).toBe(false)
	expect('lifetimeHappinessSum' in s).toBe(false)
	expect('cumulativeUncleanedPoopMs' in s).toBe(false)
})

test('isValidStateV4 accepts a fresh state', () => {
	expect(isValidStateV4(freshState(0, fixedSeed))).toBe(true)
})

test('isValidStateV4 accepts an adult state with a body', () => {
	const s = {
		...freshState(0, fixedSeed),
		stage: 'adult' as const,
		adultBody: 'roly-poly' as const,
	}
	expect(isValidStateV4(s)).toBe(true)
})

test('isValidStateV4 rejects a v3-shaped state (lifetimeHappinessSum marker)', () => {
	expect(isValidStateV4(v3Fixture())).toBe(false)
})

test('isValidStateV4 rejects state with bad adultBody', () => {
	const s = { ...freshState(0, fixedSeed), adultBody: 'wrong' }
	expect(isValidStateV4(s)).toBe(false)
})

test('isValidStateV3 accepts a v3 blob', () => {
	expect(isValidStateV3(v3Fixture())).toBe(true)
})

test('isValidStateV3 accepts an adult v3 blob with attachments', () => {
	expect(
		isValidStateV3(
			v3Fixture({
				stage: 'adult',
				adultBody: 'roly-poly',
				adultFace: 'cheerful',
				adultHead: 'halo',
				adultBack: 'wing0',
			}),
		),
	).toBe(true)
})

test('isValidStateV3 rejects a v4 (fresh) state', () => {
	expect(isValidStateV3(freshState(0, fixedSeed))).toBe(false)
})

test('isValidStateV3 rejects v2-shaped state', () => {
	expect(isValidStateV3(v2Fixture())).toBe(false)
})

test('isValidStateV3 rejects state with bad adultBody', () => {
	expect(isValidStateV3(v3Fixture({ adultBody: 'wrong' as never }))).toBe(false)
})

test('isValidStateV2 accepts an old v2 state', () => {
	expect(isValidStateV2(v2Fixture())).toBe(true)
})

test('isValidStateV2 rejects v3-shaped state', () => {
	expect(isValidStateV2(v3Fixture())).toBe(false)
})

test('isValidStateV2 rejects v4 (fresh) state', () => {
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

test('migrateV3ToV4: drops attachments and metrics, keeps body and seed', () => {
	const v4 = migrateV3ToV4(
		v3Fixture({
			stage: 'adult',
			adultBody: 'lean-spike',
			adultFace: 'cheerful',
			adultHead: 'halo',
			adultBack: 'wing1',
			happiness: 73,
			weight: 12,
			bornSeed: 99,
			totalFeedCount: 8,
			lastHappinessCheckAt: 1000,
			lifetimeHappinessSum: 500,
			lifetimeHappinessSamples: 7,
			cumulativeUncleanedPoopMs: 1000,
		}),
		5000,
	)
	expect(v4.stage).toBe('adult')
	expect(v4.adultBody).toBe('lean-spike')
	expect(v4.happiness).toBe(73)
	expect(v4.weight).toBe(12)
	expect(v4.bornSeed).toBe(99)
	expect(v4.totalFeedCount).toBe(8)
	// Adult happiness clock re-anchored to `now`, not the stale v3 value.
	expect(v4.lastHappinessCheckAt).toBe(5000)
	expect(isValidStateV4(v4)).toBe(true)
	expect('adultFace' in v4).toBe(false)
	expect('adultHead' in v4).toBe(false)
	expect('adultBack' in v4).toBe(false)
	expect('lifetimeHappinessSum' in v4).toBe(false)
	expect('cumulativeUncleanedPoopMs' in v4).toBe(false)
})

test('migrateV3ToV4: keeps the youth happiness clock (only adults re-anchor)', () => {
	const v4 = migrateV3ToV4(
		v3Fixture({ stage: 'youth', lastHappinessCheckAt: 1234 }),
		5000,
	)
	expect(v4.lastHappinessCheckAt).toBe(1234)
})

test('migrateV3ToV4 + tick: an aged adult is not retroactively collapsed', () => {
	const fiveDays = 5 * 24 * 60 * 60 * 1000
	const now = 1000 + fiveDays
	const v4 = migrateV3ToV4(
		// Stale clock from when it became adult, happiness still full.
		v3Fixture({
			stage: 'adult',
			adultBody: 'roly-poly',
			happiness: 100,
			lastHappinessCheckAt: 1000,
		}),
		now,
	)
	expect(v4.lastHappinessCheckAt).toBe(now)
	// First tick at upgrade time: zero elapsed happiness boundaries, so no
	// retroactive decay. Without the re-anchor this would crash to 0.
	const ticked = tick(v4, now, 1)
	expect(ticked.happiness).toBe(100)
})

test('migrateV2ToV3: pet stage becomes youth', () => {
	const v3 = migrateV2ToV3(
		v2Fixture({
			hunger: 3,
			lastHungerCheckAt: 5_000_000,
			lastPoopCheckAt: 5_000_000,
			happiness: 80,
			weight: 5,
			weightLastCheckAt: 5_000_000,
		}),
		6_000_000,
		fixedSeed,
	)
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
	const v3 = migrateV2ToV3(v2Fixture({ stage: 'egg' }), 1000, fixedSeed)
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

test('loadOrInit-style chain: v1 -> v2 -> v3 -> v4 yields a valid v4', () => {
	const v1 = {
		installedAt: 1000,
		stage: 'pet' as const,
		hunger: 4,
		hasPoop: false,
		lastHungerCheckAt: 1000,
		lastPoopCheckAt: 1000,
		menuCursor: 'feed' as const,
		action: undefined,
	}
	const v4 = migrateV3ToV4(
		migrateV2ToV3(migrateV1ToV2(v1, 5000), 5000, fixedSeed),
		5000,
	)
	expect(isValidStateV4(v4)).toBe(true)
	expect(v4.stage).toBe('youth')
})

test('loadOrInit: migrates a stored v3 adult blob to v4 and persists it', () => {
	const v3 = v3Fixture({
		stage: 'adult',
		adultBody: 'lanky-blob',
		adultFace: 'cheerful',
		adultHead: 'crown',
		adultBack: 'wing1',
		bornSeed: 77,
		totalFeedCount: 12,
		happiness: 88,
		lastHappinessCheckAt: 1000,
	})
	let stored: unknown = JSON.parse(JSON.stringify(v3))
	const store = globalThis as unknown as {
		AwaitStore?: {
			get: (k: string) => unknown
			set: (k: string, v: unknown) => void
		}
	}
	const orig = store.AwaitStore
	store.AwaitStore = {
		get: () => stored,
		set: (_k, v) => {
			stored = v
		},
	}
	try {
		const now = 999_000_000
		const s = loadOrInit(now)
		expect(s.stage).toBe('adult')
		expect(s.adultBody).toBe('lanky-blob')
		expect(s.bornSeed).toBe(77)
		expect(s.totalFeedCount).toBe(12)
		expect(s.happiness).toBe(88)
		expect(s.lastHappinessCheckAt).toBe(now) // adult clock re-anchored
		expect(isValidStateV4(s)).toBe(true)
		expect('adultFace' in s).toBe(false)
		expect('lifetimeHappinessSum' in s).toBe(false)
		// Persisted back to the store as a v4 blob.
		expect(isValidStateV4(stored)).toBe(true)
	} finally {
		store.AwaitStore = orig
	}
})
