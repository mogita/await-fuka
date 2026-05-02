import { expect, test } from 'bun:test'
import { applyCancel, applyCycle, applyExecute } from './intents'
import { freshState, GameState } from './state'

function pet(overrides: Partial<GameState> = {}): GameState {
	return { ...freshState(0), stage: 'youth', ...overrides }
}

// applyCycle

test('applyCycle: pet -> menu opens at cursor=feed', () => {
	const s = pet({ screen: 'pet', menuCursor: 'stats' })
	const r = applyCycle(s)
	expect(r.screen).toBe('menu')
	expect(r.menuCursor).toBe('feed')
})

test('applyCycle: menu rotates feed -> clean', () => {
	const s = pet({ screen: 'menu', menuCursor: 'feed' })
	expect(applyCycle(s).menuCursor).toBe('clean')
})

test('applyCycle: menu rotates clean -> stats', () => {
	const s = pet({ screen: 'menu', menuCursor: 'clean' })
	expect(applyCycle(s).menuCursor).toBe('stats')
})

test('applyCycle: menu rotates stats -> feed', () => {
	const s = pet({ screen: 'menu', menuCursor: 'stats' })
	expect(applyCycle(s).menuCursor).toBe('feed')
})

test('applyCycle: stats -> no-op', () => {
	const s = pet({ screen: 'stats' })
	expect(applyCycle(s)).toBe(s)
})

test('applyCycle: egg -> no-op', () => {
	const s = freshState(0)
	expect(applyCycle(s)).toBe(s)
})

// applyExecute

test('applyExecute: feed succeeds when hunger<5 and no action', () => {
	const s = pet({ screen: 'menu', menuCursor: 'feed', hunger: 2, weight: 1 })
	const r = applyExecute(s, 1000, 1)
	expect(r.hunger).toBe(3)
	expect(r.weight).toBeCloseTo(1 + (50 - 1) * 0.02, 5)
	expect(r.action).toEqual({ kind: 'feed', until: 4000 })
	expect(r.screen).toBe('pet')
})

test('applyExecute: feed at hunger=5 sets rejection and returns to pet', () => {
	const s = pet({
		screen: 'menu',
		menuCursor: 'feed',
		hunger: 5,
		weight: 5,
	})
	const r = applyExecute(s, 1000, 1)
	expect(r.hunger).toBe(5)
	expect(r.weight).toBe(5)
	expect(r.action).toBeUndefined()
	expect(r.rejection).toEqual({ until: 4000 })
	expect(r.screen).toBe('pet')
})

test('applyExecute: feed when action active sets rejection', () => {
	const s = pet({
		screen: 'menu',
		menuCursor: 'feed',
		hunger: 2,
		action: { kind: 'feed', until: 5000 },
	})
	const r = applyExecute(s, 1000, 1)
	expect(r.hunger).toBe(2)
	expect(r.action).toEqual({ kind: 'feed', until: 5000 })
	expect(r.rejection).toEqual({ until: 4000 })
	expect(r.screen).toBe('pet')
})

test('applyExecute: feed grows weight clamped at WEIGHT_CAP', () => {
	const s = pet({
		screen: 'menu',
		menuCursor: 'feed',
		hunger: 1,
		weight: 49.9,
	})
	const r = applyExecute(s, 1000, 1)
	expect(r.weight).toBeLessThanOrEqual(50)
	expect(r.weight).toBeGreaterThan(49.9)
})

test('applyExecute: clean succeeds when hasPoop and no action', () => {
	const s = pet({
		screen: 'menu',
		menuCursor: 'clean',
		hasPoop: true,
	})
	const r = applyExecute(s, 1000, 1)
	expect(r.hasPoop).toBe(false)
	expect(r.lastPoopCheckAt).toBe(1000)
	expect(r.action).toEqual({ kind: 'clean', until: 4000 })
	expect(r.screen).toBe('pet')
})

test('applyExecute: clean with no poop closes menu silently (no rejection)', () => {
	const s = pet({
		screen: 'menu',
		menuCursor: 'clean',
		hasPoop: false,
	})
	const r = applyExecute(s, 1000, 1)
	expect(r.hasPoop).toBe(false)
	expect(r.action).toBeUndefined()
	expect(r.rejection).toBeUndefined()
	expect(r.screen).toBe('pet')
})

test('applyExecute: clean when action active closes menu silently', () => {
	const s = pet({
		screen: 'menu',
		menuCursor: 'clean',
		hasPoop: true,
		action: { kind: 'feed', until: 5000 },
	})
	const r = applyExecute(s, 1000, 1)
	expect(r.hasPoop).toBe(true)
	expect(r.rejection).toBeUndefined()
	expect(r.screen).toBe('pet')
})

test('applyExecute: stats flips screen to stats', () => {
	const s = pet({ screen: 'menu', menuCursor: 'stats' })
	const r = applyExecute(s, 1000, 1)
	expect(r.screen).toBe('stats')
})

test('applyExecute: pet screen is no-op', () => {
	const s = pet({ screen: 'pet' })
	expect(applyExecute(s, 1000, 1)).toBe(s)
})

test('applyExecute: stats screen is no-op', () => {
	const s = pet({ screen: 'stats' })
	expect(applyExecute(s, 1000, 1)).toBe(s)
})

test('applyExecute: egg is no-op', () => {
	const s = {
		...freshState(0),
		screen: 'menu' as const,
		menuCursor: 'feed' as const,
	}
	expect(applyExecute(s, 1000, 1)).toBe(s)
})

test('applyExecute: action.until aligns to mask cycle even at high worldSpeed', () => {
	const s = pet({ screen: 'menu', menuCursor: 'feed', hunger: 2 })
	const r = applyExecute(s, 1000, 100)
	expect(r.action!.until).toBe(2000) // ceil((1000 + 20)/2000) * 2000
})

test('applyExecute: rejection.until aligns to mask cycle even at high worldSpeed', () => {
	const s = pet({ screen: 'menu', menuCursor: 'feed', hunger: 5 })
	const r = applyExecute(s, 1000, 100)
	expect(r.rejection!.until).toBe(2000) // ceil((1000 + 20)/2000) * 2000
})

// applyCancel

test('applyCancel: menu -> pet', () => {
	const s = pet({ screen: 'menu', menuCursor: 'clean' })
	expect(applyCancel(s).screen).toBe('pet')
})

test('applyCancel: stats -> pet (skips menu)', () => {
	const s = pet({ screen: 'stats' })
	expect(applyCancel(s).screen).toBe('pet')
})

test('applyCancel: pet -> no-op', () => {
	const s = pet({ screen: 'pet' })
	expect(applyCancel(s)).toBe(s)
})

test('applyCancel: egg -> no-op', () => {
	const s = freshState(0)
	expect(applyCancel(s)).toBe(s)
})
