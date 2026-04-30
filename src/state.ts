import { HATCH_DURATION_MS, STORE_KEY, worldSpeed } from './config'

export type GameStage = 'egg' | 'pet'
export type ActionKind = 'feed' | 'clean'
export type Screen = 'pet' | 'menu' | 'stats'
export type MenuCursor = 'feed' | 'clean' | 'stats'

export type GameState = {
	installedAt: number
	stage: GameStage
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

// Pre-v2 shape used only inside migration.
type GameStateV1 = {
	installedAt: number
	stage: GameStage
	hunger: number
	hasPoop: boolean
	lastHungerCheckAt: number
	lastPoopCheckAt: number
	menuCursor: 'none' | 'feed' | 'clean'
	action: { kind: ActionKind; until: number } | undefined
}

export function freshState(now: number): GameState {
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
	}
}

export function isValidStateV2(value: unknown): value is GameState {
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
	if (
		v.hungerZeroSince !== undefined &&
		typeof v.hungerZeroSince !== 'number'
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

export function migrateV1ToV2(v1: GameStateV1, now: number): GameState {
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

export function loadOrInit(now: number): GameState {
	const raw = AwaitStore.get(STORE_KEY)
	if (isValidStateV2(raw)) return raw
	if (isValidStateV1(raw)) {
		const migrated = migrateV1ToV2(raw, now)
		AwaitStore.set(STORE_KEY, migrated as Encodable)
		return migrated
	}
	const fresh = freshState(now)
	AwaitStore.set(STORE_KEY, fresh as Encodable)
	return fresh
}

export function save(state: GameState): void {
	AwaitStore.set(STORE_KEY, state as Encodable)
}
