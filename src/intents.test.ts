import { expect, test } from 'bun:test'
import { HAPPINESS_CLEAN_BONUS, HAPPINESS_FEED_BONUS } from './config'
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

test('applyExecute: feed with poop sets rejection and does not feed', () => {
	const s = pet({
		screen: 'menu',
		menuCursor: 'feed',
		hunger: 2,
		weight: 5,
		hasPoop: true,
		happiness: 50,
		totalFeedCount: 7,
		lastPoopCheckAt: 123,
	})
	const r = applyExecute(s, 1000, 1)
	expect(r.hunger).toBe(2)
	expect(r.weight).toBe(5)
	expect(r.happiness).toBe(50)
	expect(r.totalFeedCount).toBe(7)
	expect(r.action).toBeUndefined()
	expect(r.rejection).toEqual({ until: 4000 })
	expect(r.screen).toBe('pet')
	expect(r.hasPoop).toBe(true)
	expect(r.lastPoopCheckAt).toBe(123)
})

test('applyExecute: feed with poop AND hunger=5 stays blocked, leaves both unchanged', () => {
	const s = pet({
		screen: 'menu',
		menuCursor: 'feed',
		hunger: 5,
		hasPoop: true,
		totalFeedCount: 7,
	})
	const r = applyExecute(s, 1000, 1)
	expect(r.hunger).toBe(5)
	expect(r.hasPoop).toBe(true)
	expect(r.totalFeedCount).toBe(7)
	expect(r.action).toBeUndefined()
	expect(r.rejection).toEqual({ until: 4000 })
	expect(r.screen).toBe('pet')
})

test('applyExecute: feed with poop while action active dismisses silently (no rejection)', () => {
	const s = pet({
		screen: 'menu',
		menuCursor: 'feed',
		hunger: 2,
		hasPoop: true,
		action: { kind: 'feed', until: 5000 },
	})
	const r = applyExecute(s, 1000, 1)
	expect(r.hunger).toBe(2)
	expect(r.action).toEqual({ kind: 'feed', until: 5000 })
	expect(r.rejection).toBeUndefined()
	expect(r.screen).toBe('pet')
})

test('applyExecute: feed succeeds after poop cleaned (no poop)', () => {
	const s = pet({
		screen: 'menu',
		menuCursor: 'feed',
		hunger: 2,
		weight: 1,
		hasPoop: false,
	})
	const r = applyExecute(s, 1000, 1)
	expect(r.hunger).toBe(3)
	expect(r.weight).toBeCloseTo(1 + (50 - 1) * 0.02, 5)
	expect(r.action).toEqual({ kind: 'feed', until: 4000 })
	expect(r.rejection).toBeUndefined()
})

test('applyExecute: rapid feed during eat animation still feeds and restarts it', () => {
	const s = pet({
		screen: 'menu',
		menuCursor: 'feed',
		hunger: 2,
		weight: 1,
		totalFeedCount: 7,
		action: { kind: 'feed', until: 5000 },
	})
	const r = applyExecute(s, 1000, 1)
	expect(r.hunger).toBe(3)
	expect(r.weight).toBeCloseTo(1 + (50 - 1) * 0.02, 5)
	expect(r.totalFeedCount).toBe(8)
	expect(r.action).toEqual({ kind: 'feed', until: 4000 })
	expect(r.rejection).toBeUndefined()
	expect(r.screen).toBe('pet')
})

test('applyExecute: feed during clean animation switches action to feed', () => {
	const s = pet({
		screen: 'menu',
		menuCursor: 'feed',
		hunger: 2,
		action: { kind: 'clean', until: 5000 },
	})
	const r = applyExecute(s, 1000, 1)
	expect(r.hunger).toBe(3)
	expect(r.action).toEqual({ kind: 'feed', until: 4000 })
	expect(r.rejection).toBeUndefined()
})

test('applyExecute: feed at full during animation stays silent (no shake mid-eat)', () => {
	const s = pet({
		screen: 'menu',
		menuCursor: 'feed',
		hunger: 5,
		action: { kind: 'feed', until: 5000 },
	})
	const r = applyExecute(s, 1000, 1)
	expect(r.hunger).toBe(5)
	expect(r.action).toEqual({ kind: 'feed', until: 5000 })
	expect(r.rejection).toBeUndefined()
	expect(r.screen).toBe('pet')
})

test('applyExecute: rapid feed during eat animation refreshes action.until at high worldSpeed', () => {
	const s = pet({
		screen: 'menu',
		menuCursor: 'feed',
		hunger: 2,
		action: { kind: 'feed', until: 5000 },
	})
	const r = applyExecute(s, 1000, 100)
	expect(r.hunger).toBe(3)
	expect(r.action).toEqual({ kind: 'feed', until: 2000 })
})

test('applyExecute: successful feed clears any in-flight rejection', () => {
	const s = pet({
		screen: 'menu',
		menuCursor: 'feed',
		hunger: 2,
		rejection: { until: 9000 },
	})
	const r = applyExecute(s, 1000, 1)
	expect(r.hunger).toBe(3)
	expect(r.action).toEqual({ kind: 'feed', until: 4000 })
	expect(r.rejection).toBeUndefined()
})

test('applyExecute: feed to full then idle tap shakes', () => {
	const s = pet({ screen: 'menu', menuCursor: 'feed', hunger: 4 })
	const fed = applyExecute(s, 1000, 1)
	expect(fed.hunger).toBe(5)
	expect(fed.action).toEqual({ kind: 'feed', until: 4000 })
	// Animation has since cleared; tap feed again while full and idle.
	const idle = { ...fed, action: undefined, screen: 'menu' as const }
	const r = applyExecute(idle, 9000, 1)
	expect(r.hunger).toBe(5)
	expect(r.action).toBeUndefined()
	expect(r.rejection).toEqual({ until: 12000 }) // ceil((9000 + 2000) / 2000) * 2000
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

test('applyExecute: clean during another animation still cleans and switches action', () => {
	const s = pet({
		screen: 'menu',
		menuCursor: 'clean',
		hasPoop: true,
		happiness: 70,
		action: { kind: 'feed', until: 5000 },
	})
	const r = applyExecute(s, 1000, 1)
	expect(r.hasPoop).toBe(false)
	expect(r.lastPoopCheckAt).toBe(1000)
	expect(r.happiness).toBe(70 + HAPPINESS_CLEAN_BONUS)
	expect(r.action).toEqual({ kind: 'clean', until: 4000 })
	expect(r.rejection).toBeUndefined()
	expect(r.screen).toBe('pet')
})

test('applyExecute: rapid clean during clean animation still cleans and refreshes action', () => {
	const s = pet({
		screen: 'menu',
		menuCursor: 'clean',
		hasPoop: true,
		happiness: 50,
		action: { kind: 'clean', until: 5000 },
	})
	const r = applyExecute(s, 1000, 1)
	expect(r.hasPoop).toBe(false)
	expect(r.lastPoopCheckAt).toBe(1000)
	expect(r.happiness).toBe(50 + HAPPINESS_CLEAN_BONUS)
	expect(r.action).toEqual({ kind: 'clean', until: 4000 })
	expect(r.rejection).toBeUndefined()
	expect(r.screen).toBe('pet')
})

test('applyExecute: clean with no poop during clean animation is silent and leaves action intact', () => {
	const s = pet({
		screen: 'menu',
		menuCursor: 'clean',
		hasPoop: false,
		action: { kind: 'clean', until: 5000 },
	})
	const r = applyExecute(s, 1000, 1)
	expect(r.hasPoop).toBe(false)
	expect(r.action).toEqual({ kind: 'clean', until: 5000 })
	expect(r.rejection).toBeUndefined()
	expect(r.screen).toBe('pet')
})

test('applyExecute: successful clean clears any in-flight rejection', () => {
	const s = pet({
		screen: 'menu',
		menuCursor: 'clean',
		hasPoop: true,
		rejection: { until: 9000 },
	})
	const r = applyExecute(s, 1000, 1)
	expect(r.hasPoop).toBe(false)
	expect(r.action).toEqual({ kind: 'clean', until: 4000 })
	expect(r.rejection).toBeUndefined()
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

test('applyExecute: feed adds HAPPINESS_FEED_BONUS to happiness, clamped at 100', () => {
	const s = pet({
		screen: 'menu',
		menuCursor: 'feed',
		hunger: 2,
		happiness: 50,
	})
	const r = applyExecute(s, 1000, 1)
	expect(r.happiness).toBe(50 + HAPPINESS_FEED_BONUS)
})

test('applyExecute: feed clamps happiness at 100', () => {
	const s = pet({
		screen: 'menu',
		menuCursor: 'feed',
		hunger: 2,
		happiness: 95,
	})
	const r = applyExecute(s, 1000, 1)
	expect(r.happiness).toBe(100)
})

test('applyExecute: feed increments totalFeedCount', () => {
	const s = pet({
		screen: 'menu',
		menuCursor: 'feed',
		hunger: 2,
		totalFeedCount: 7,
	})
	const r = applyExecute(s, 1000, 1)
	expect(r.totalFeedCount).toBe(8)
})

test('applyExecute: rejected feed does not increment totalFeedCount or happiness', () => {
	const s = pet({
		screen: 'menu',
		menuCursor: 'feed',
		hunger: 5,
		happiness: 50,
		totalFeedCount: 7,
	})
	const r = applyExecute(s, 1000, 1)
	expect(r.totalFeedCount).toBe(7)
	expect(r.happiness).toBe(50)
})

test('applyExecute: clean adds HAPPINESS_CLEAN_BONUS to happiness, clamped at 100', () => {
	const s = pet({
		screen: 'menu',
		menuCursor: 'clean',
		hasPoop: true,
		happiness: 70,
	})
	const r = applyExecute(s, 1000, 1)
	expect(r.happiness).toBe(70 + HAPPINESS_CLEAN_BONUS)
})

test('applyExecute: clean failure does not add happiness', () => {
	const s = pet({
		screen: 'menu',
		menuCursor: 'clean',
		hasPoop: false,
		happiness: 70,
	})
	const r = applyExecute(s, 1000, 1)
	expect(r.happiness).toBe(70)
})
