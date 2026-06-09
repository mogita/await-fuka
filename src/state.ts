import { HATCH_DURATION_MS, STORE_KEY, worldSpeed } from './config'

export type Stage = 'egg' | 'youth' | 'adult'
export type ActionKind = 'feed' | 'clean'
export type Screen = 'pet' | 'menu' | 'stats'
export type MenuCursor = 'feed' | 'clean' | 'stats'

export type BodyArchetype =
	| 'roly-poly'
	| 'lanky-blob'
	| 'lean-spike'
	| 'stout-rock'

// Live, care-driven adult face mood. Derived from current happiness when
// rendering, so it is never stored on the state.
export type Mood = 'miserable' | 'down' | 'neutral' | 'content' | 'radiant'

export type RandomSource = () => number

export type GameState = {
	installedAt: number
	stage: Stage
	hunger: number
	hasPoop: boolean
	lastHungerCheckAt: number
	lastPoopCheckAt: number
	action: { kind: ActionKind; until: number } | undefined

	screen: Screen
	menuCursor: MenuCursor

	bornAt: number
	happiness: number
	weight: number
	hungerZeroSince: number | undefined
	weightLastCheckAt: number

	rejection: { until: number } | undefined

	// Evolution (v4): the body is innate seed identity, snapshotted at
	// adulthood. The face mood is derived live from happiness at render time,
	// so it is not stored.
	bornSeed: number
	adultBody: BodyArchetype | undefined

	lastHappinessCheckAt: number
	totalFeedCount: number
}

// Pre-v4 shape: the adult was a 4-part composite (seed body + seed face
// personality + care-driven head and back attachments), with cumulative care
// metrics feeding the attachment snapshot. v4 collapses it to body + live mood
// face, so those fields are read once during migration and then dropped.
type GameStateV3 = {
	installedAt: number
	stage: Stage
	hunger: number
	hasPoop: boolean
	lastHungerCheckAt: number
	lastPoopCheckAt: number
	action: { kind: ActionKind; until: number } | undefined
	screen: Screen
	menuCursor: MenuCursor
	bornAt: number
	happiness: number
	weight: number
	hungerZeroSince: number | undefined
	weightLastCheckAt: number
	rejection: { until: number } | undefined
	bornSeed: number
	adultBody: BodyArchetype | undefined
	adultFace: string | undefined
	adultHead: string | undefined
	adultBack: string | undefined
	lastHappinessCheckAt: number
	cumulativeHungerZeroMs: number
	cumulativeUncleanedPoopMs: number
	totalFeedCount: number
	lifetimeHappinessSum: number
	lifetimeHappinessSamples: number
}

// Pre-v3 shape (v2: stage was 'egg' | 'pet'). Used only inside migration.
type GameStateV2 = {
	installedAt: number
	stage: 'egg' | 'pet'
	hunger: number
	hasPoop: boolean
	lastHungerCheckAt: number
	lastPoopCheckAt: number
	action: { kind: ActionKind; until: number } | undefined
	screen: Screen
	menuCursor: MenuCursor
	bornAt: number
	happiness: number
	weight: number
	hungerZeroSince: number | undefined
	weightLastCheckAt: number
	rejection: { until: number } | undefined
}

// Pre-v2 shape. Chained migration v1 -> v2 -> v3 -> v4.
type GameStateV1 = {
	installedAt: number
	stage: 'egg' | 'pet'
	hunger: number
	hasPoop: boolean
	lastHungerCheckAt: number
	lastPoopCheckAt: number
	menuCursor: 'none' | 'feed' | 'clean'
	action: { kind: ActionKind; until: number } | undefined
}

const SEED_MAX = 2147483647 // 2^31 - 1

function newSeed(random: RandomSource): number {
	return Math.floor(random() * SEED_MAX)
}

export function freshState(
	now: number,
	random: RandomSource = Math.random,
): GameState {
	const hatchAt = now + HATCH_DURATION_MS / worldSpeed
	return {
		installedAt: now,
		stage: 'egg',
		hunger: 5,
		hasPoop: false,
		lastHungerCheckAt: now,
		lastPoopCheckAt: now,
		action: undefined,
		screen: 'pet',
		menuCursor: 'feed',
		bornAt: hatchAt,
		happiness: 100,
		weight: 0.1,
		hungerZeroSince: undefined,
		weightLastCheckAt: now,
		rejection: undefined,
		bornSeed: newSeed(random),
		adultBody: undefined,
		lastHappinessCheckAt: now,
		totalFeedCount: 0,
	}
}

export function isValidStateV4(value: unknown): value is GameState {
	if (typeof value !== 'object' || value === null) return false
	const v = value as Record<string, unknown>
	if ('lifetimeHappinessSum' in v) return false // v3 marker
	if (typeof v.installedAt !== 'number') return false
	if (v.stage !== 'egg' && v.stage !== 'youth' && v.stage !== 'adult')
		return false
	if (typeof v.hunger !== 'number') return false
	if (v.hunger < 0 || v.hunger > 5) return false
	if (typeof v.hasPoop !== 'boolean') return false
	if (typeof v.lastHungerCheckAt !== 'number') return false
	if (typeof v.lastPoopCheckAt !== 'number') return false
	if (v.screen !== 'pet' && v.screen !== 'menu' && v.screen !== 'stats')
		return false
	if (
		v.menuCursor !== 'feed' &&
		v.menuCursor !== 'clean' &&
		v.menuCursor !== 'stats'
	)
		return false
	if (typeof v.bornAt !== 'number') return false
	if (typeof v.happiness !== 'number') return false
	if (v.happiness < 0 || v.happiness > 100) return false
	if (typeof v.weight !== 'number') return false
	if (v.weight < 0 || v.weight > 1000) return false
	if (typeof v.weightLastCheckAt !== 'number') return false
	if (v.hungerZeroSince !== undefined && typeof v.hungerZeroSince !== 'number')
		return false
	if (typeof v.bornSeed !== 'number') return false
	if (typeof v.lastHappinessCheckAt !== 'number') return false
	if (typeof v.totalFeedCount !== 'number') return false
	if (
		v.adultBody !== undefined &&
		v.adultBody !== 'roly-poly' &&
		v.adultBody !== 'lanky-blob' &&
		v.adultBody !== 'lean-spike' &&
		v.adultBody !== 'stout-rock'
	)
		return false
	if (v.action !== undefined) {
		if (typeof v.action !== 'object' || v.action === null) return false
		const a = v.action as Record<string, unknown>
		if (a.kind !== 'feed' && a.kind !== 'clean') return false
		if (typeof a.until !== 'number') return false
	}
	if (v.rejection !== undefined) {
		if (typeof v.rejection !== 'object' || v.rejection === null) return false
		const r = v.rejection as Record<string, unknown>
		if (typeof r.until !== 'number') return false
	}
	return true
}

export function isValidStateV3(value: unknown): value is GameStateV3 {
	if (typeof value !== 'object' || value === null) return false
	const v = value as Record<string, unknown>
	if (typeof v.installedAt !== 'number') return false
	if (v.stage !== 'egg' && v.stage !== 'youth' && v.stage !== 'adult')
		return false
	if (typeof v.hunger !== 'number') return false
	if (v.hunger < 0 || v.hunger > 5) return false
	if (typeof v.hasPoop !== 'boolean') return false
	if (typeof v.lastHungerCheckAt !== 'number') return false
	if (typeof v.lastPoopCheckAt !== 'number') return false
	if (v.screen !== 'pet' && v.screen !== 'menu' && v.screen !== 'stats')
		return false
	if (
		v.menuCursor !== 'feed' &&
		v.menuCursor !== 'clean' &&
		v.menuCursor !== 'stats'
	)
		return false
	if (typeof v.bornAt !== 'number') return false
	if (typeof v.happiness !== 'number') return false
	if (v.happiness < 0 || v.happiness > 100) return false
	if (typeof v.weight !== 'number') return false
	if (v.weight < 0 || v.weight > 1000) return false
	if (typeof v.weightLastCheckAt !== 'number') return false
	if (v.hungerZeroSince !== undefined && typeof v.hungerZeroSince !== 'number')
		return false
	if (typeof v.bornSeed !== 'number') return false
	if (typeof v.lastHappinessCheckAt !== 'number') return false
	if (typeof v.cumulativeHungerZeroMs !== 'number') return false
	if (typeof v.cumulativeUncleanedPoopMs !== 'number') return false
	if (typeof v.totalFeedCount !== 'number') return false
	if (typeof v.lifetimeHappinessSum !== 'number') return false
	if (typeof v.lifetimeHappinessSamples !== 'number') return false
	if (
		v.adultBody !== undefined &&
		v.adultBody !== 'roly-poly' &&
		v.adultBody !== 'lanky-blob' &&
		v.adultBody !== 'lean-spike' &&
		v.adultBody !== 'stout-rock'
	)
		return false
	if (
		v.adultFace !== undefined &&
		v.adultFace !== 'cheerful' &&
		v.adultFace !== 'sleepy' &&
		v.adultFace !== 'sly' &&
		v.adultFace !== 'innocent' &&
		v.adultFace !== 'grumpy' &&
		v.adultFace !== 'wise'
	)
		return false
	if (
		v.adultHead !== undefined &&
		v.adultHead !== 'halo' &&
		v.adultHead !== 'crown' &&
		v.adultHead !== 'plant' &&
		v.adultHead !== 'bare'
	)
		return false
	if (
		v.adultBack !== undefined &&
		v.adultBack !== 'wing0' &&
		v.adultBack !== 'wing1' &&
		v.adultBack !== 'bare'
	)
		return false
	if (v.action !== undefined) {
		if (typeof v.action !== 'object' || v.action === null) return false
		const a = v.action as Record<string, unknown>
		if (a.kind !== 'feed' && a.kind !== 'clean') return false
		if (typeof a.until !== 'number') return false
	}
	if (v.rejection !== undefined) {
		if (typeof v.rejection !== 'object' || v.rejection === null) return false
		const r = v.rejection as Record<string, unknown>
		if (typeof r.until !== 'number') return false
	}
	return true
}

export function isValidStateV2(value: unknown): value is GameStateV2 {
	if (typeof value !== 'object' || value === null) return false
	const v = value as Record<string, unknown>
	if (typeof v.installedAt !== 'number') return false
	if (v.stage !== 'egg' && v.stage !== 'pet') return false
	if (typeof v.hunger !== 'number') return false
	if (v.hunger < 0 || v.hunger > 5) return false
	if (typeof v.hasPoop !== 'boolean') return false
	if (typeof v.lastHungerCheckAt !== 'number') return false
	if (typeof v.lastPoopCheckAt !== 'number') return false
	if (v.screen !== 'pet' && v.screen !== 'menu' && v.screen !== 'stats')
		return false
	if (
		v.menuCursor !== 'feed' &&
		v.menuCursor !== 'clean' &&
		v.menuCursor !== 'stats'
	)
		return false
	if (typeof v.bornAt !== 'number') return false
	if (typeof v.happiness !== 'number') return false
	if (v.happiness < 0 || v.happiness > 100) return false
	if (typeof v.weight !== 'number') return false
	if (v.weight < 0 || v.weight > 1000) return false
	if (typeof v.weightLastCheckAt !== 'number') return false
	if (v.hungerZeroSince !== undefined && typeof v.hungerZeroSince !== 'number')
		return false
	if ('bornSeed' in v) return false // v3 marker
	if (v.action !== undefined) {
		if (typeof v.action !== 'object' || v.action === null) return false
		const a = v.action as Record<string, unknown>
		if (a.kind !== 'feed' && a.kind !== 'clean') return false
		if (typeof a.until !== 'number') return false
	}
	return true
}

export function isValidStateV1(value: unknown): value is GameStateV1 {
	if (typeof value !== 'object' || value === null) return false
	const v = value as Record<string, unknown>
	if (typeof v.installedAt !== 'number') return false
	if (v.stage !== 'egg' && v.stage !== 'pet') return false
	if (typeof v.hunger !== 'number') return false
	if (v.hunger < 0 || v.hunger > 4) return false
	if (typeof v.hasPoop !== 'boolean') return false
	if (typeof v.lastHungerCheckAt !== 'number') return false
	if (typeof v.lastPoopCheckAt !== 'number') return false
	if (
		v.menuCursor !== 'none' &&
		v.menuCursor !== 'feed' &&
		v.menuCursor !== 'clean'
	)
		return false
	if ('screen' in v) return false // v2 marker
	if (v.action !== undefined) {
		if (typeof v.action !== 'object' || v.action === null) return false
		const a = v.action as Record<string, unknown>
		if (a.kind !== 'feed' && a.kind !== 'clean') return false
		if (typeof a.until !== 'number') return false
	}
	return true
}

export function migrateV3ToV4(v3: GameStateV3, now: number): GameState {
	// Drop the head/back attachments, seed face personality, and the cumulative
	// care metrics that only fed the attachment snapshot. Body and seed survive;
	// the face becomes a live mood derived from happiness.
	//
	// v3 froze happiness at adulthood (its decay was youth-only), so an adult's
	// lastHappinessCheckAt is stale at the adulthood timestamp. v4 decays
	// happiness for adults too, so re-anchor the adult clock to `now`; otherwise
	// the first post-upgrade tick would apply the whole elapsed adult duration
	// as one retroactive drop and collapse a well-cared adult to miserable.
	return {
		installedAt: v3.installedAt,
		stage: v3.stage,
		hunger: v3.hunger,
		hasPoop: v3.hasPoop,
		lastHungerCheckAt: v3.lastHungerCheckAt,
		lastPoopCheckAt: v3.lastPoopCheckAt,
		action: v3.action,
		screen: v3.screen,
		menuCursor: v3.menuCursor,
		bornAt: v3.bornAt,
		happiness: v3.happiness,
		weight: v3.weight,
		hungerZeroSince: v3.hungerZeroSince,
		weightLastCheckAt: v3.weightLastCheckAt,
		rejection: v3.rejection,
		bornSeed: v3.bornSeed,
		adultBody: v3.adultBody,
		lastHappinessCheckAt: v3.stage === 'adult' ? now : v3.lastHappinessCheckAt,
		totalFeedCount: v3.totalFeedCount,
	}
}

export function migrateV2ToV3(
	v2: GameStateV2,
	now: number,
	random: RandomSource = Math.random,
): GameStateV3 {
	const newStage: Stage = v2.stage === 'egg' ? 'egg' : 'youth'
	return {
		installedAt: v2.installedAt,
		stage: newStage,
		hunger: v2.hunger,
		hasPoop: v2.hasPoop,
		lastHungerCheckAt: v2.lastHungerCheckAt,
		lastPoopCheckAt: v2.lastPoopCheckAt,
		action: v2.action,
		screen: v2.screen,
		menuCursor: v2.menuCursor,
		bornAt: v2.bornAt,
		happiness: v2.happiness,
		weight: v2.weight,
		hungerZeroSince: v2.hungerZeroSince,
		weightLastCheckAt: v2.weightLastCheckAt,
		rejection: v2.rejection,
		bornSeed: newSeed(random),
		adultBody: undefined,
		adultFace: undefined,
		adultHead: undefined,
		adultBack: undefined,
		lastHappinessCheckAt: now,
		cumulativeHungerZeroMs: 0,
		cumulativeUncleanedPoopMs: 0,
		totalFeedCount: 0,
		lifetimeHappinessSum: 0,
		lifetimeHappinessSamples: 0,
	}
}

export function migrateV1ToV2(v1: GameStateV1, now: number): GameStateV2 {
	const hatchAt = v1.installedAt + HATCH_DURATION_MS / worldSpeed
	return {
		installedAt: v1.installedAt,
		stage: v1.stage,
		hunger: v1.hunger,
		hasPoop: v1.hasPoop,
		lastHungerCheckAt: v1.lastHungerCheckAt,
		lastPoopCheckAt: v1.lastPoopCheckAt,
		action: v1.action,
		screen: 'pet',
		menuCursor: 'feed',
		bornAt: hatchAt,
		happiness: 100,
		weight: 0.1,
		hungerZeroSince: v1.hunger === 0 ? now : undefined,
		weightLastCheckAt: now,
		rejection: undefined,
	}
}

export function loadOrInit(
	now: number,
	random: RandomSource = Math.random,
): GameState {
	const raw = AwaitStore.get(STORE_KEY)
	if (isValidStateV4(raw)) return raw
	if (isValidStateV3(raw)) {
		const migrated = migrateV3ToV4(raw, now)
		AwaitStore.set(STORE_KEY, migrated as Encodable)
		return migrated
	}
	if (isValidStateV2(raw)) {
		const migrated = migrateV3ToV4(migrateV2ToV3(raw, now, random), now)
		AwaitStore.set(STORE_KEY, migrated as Encodable)
		return migrated
	}
	if (isValidStateV1(raw)) {
		const v2 = migrateV1ToV2(raw, now)
		const migrated = migrateV3ToV4(migrateV2ToV3(v2, now, random), now)
		AwaitStore.set(STORE_KEY, migrated as Encodable)
		return migrated
	}
	const fresh = freshState(now, random)
	AwaitStore.set(STORE_KEY, fresh as Encodable)
	return fresh
}

export function save(state: GameState): void {
	AwaitStore.set(STORE_KEY, state as Encodable)
}
