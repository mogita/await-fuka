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
export type FacePersonality =
	| 'cheerful'
	| 'sleepy'
	| 'sly'
	| 'innocent'
	| 'grumpy'
	| 'wise'
export type HeadAttachment = 'halo' | 'horns' | 'crown' | 'plant' | 'bare'
export type BackAttachment = 'feathered' | 'bat' | 'insect' | 'bare'

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

	// v3 evolution fields
	bornSeed: number
	adultBody: BodyArchetype | undefined
	adultFace: FacePersonality | undefined
	adultHead: HeadAttachment | undefined
	adultBack: BackAttachment | undefined

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

// Pre-v2 shape. Chained migration v1 -> v2 -> v3.
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

export function isValidStateV3(value: unknown): value is GameState {
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
		v.adultHead !== 'horns' &&
		v.adultHead !== 'crown' &&
		v.adultHead !== 'plant' &&
		v.adultHead !== 'bare'
	)
		return false
	if (
		v.adultBack !== undefined &&
		v.adultBack !== 'feathered' &&
		v.adultBack !== 'bat' &&
		v.adultBack !== 'insect' &&
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

export function migrateV2ToV3(
	v2: GameStateV2,
	now: number,
	random: RandomSource = Math.random,
): GameState {
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
	if (isValidStateV3(raw)) return raw
	if (isValidStateV2(raw)) {
		const migrated = migrateV2ToV3(raw, now, random)
		AwaitStore.set(STORE_KEY, migrated as Encodable)
		return migrated
	}
	if (isValidStateV1(raw)) {
		const v2 = migrateV1ToV2(raw, now)
		const migrated = migrateV2ToV3(v2, now, random)
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
