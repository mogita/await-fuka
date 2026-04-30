import { test, expect } from 'bun:test'
import {
	cleanIconUrl,
	feedIconUrl,
	happinessFaceUrl,
	petAnimSpec,
	statsIconUrl,
} from './assets'
import { freshState, GameState } from './state'

function pet(overrides: Partial<GameState> = {}): GameState {
	return { ...freshState(0), stage: 'pet', ...overrides }
}

test('petAnimSpec: egg stage returns 2 egg frames', () => {
	const s = freshState(0)
	const spec = petAnimSpec(s)
	expect(spec.urls).toEqual(['assets/pet-egg-0.png', 'assets/pet-egg-1.png'])
})

test('petAnimSpec: feed action returns 2 eating frames', () => {
	const s = pet({ action: { kind: 'feed', until: 999999 } })
	const spec = petAnimSpec(s)
	expect(spec.urls).toEqual([
		'assets/pet-eating-0.png',
		'assets/pet-eating-2.png',
	])
})

test('petAnimSpec: clean action returns 2 happy frames', () => {
	const s = pet({ action: { kind: 'clean', until: 999999 } })
	const spec = petAnimSpec(s)
	expect(spec.urls).toEqual([
		'assets/pet-happy-0.png',
		'assets/pet-happy-1.png',
	])
})

test('petAnimSpec: hunger=0 with no action returns 2 hungry frames', () => {
	const s = pet({ hunger: 0 })
	const spec = petAnimSpec(s)
	expect(spec.urls).toEqual([
		'assets/pet-hungry-0.png',
		'assets/pet-hungry-1.png',
	])
})

test('petAnimSpec: idle (default) returns 2 idle frames', () => {
	const s = pet()
	const spec = petAnimSpec(s)
	expect(spec.urls).toEqual(['assets/pet-idle-0.png', 'assets/pet-idle-1.png'])
})

test('petAnimSpec: action takes priority over hunger=0', () => {
	const s = pet({ hunger: 0, action: { kind: 'feed', until: 999999 } })
	const spec = petAnimSpec(s)
	expect(spec.urls[0]).toBe('assets/pet-eating-0.png')
})

test('feedIconUrl: returns selected when cursor=feed, normal otherwise', () => {
	expect(feedIconUrl('feed')).toBe('assets/icon-feed-selected.png')
	expect(feedIconUrl('clean')).toBe('assets/icon-feed-normal.png')
	expect(feedIconUrl('stats')).toBe('assets/icon-feed-normal.png')
})

test('cleanIconUrl: returns selected when cursor=clean, normal otherwise', () => {
	expect(cleanIconUrl('clean')).toBe('assets/icon-clean-selected.png')
	expect(cleanIconUrl('feed')).toBe('assets/icon-clean-normal.png')
	expect(cleanIconUrl('stats')).toBe('assets/icon-clean-normal.png')
})

test('happinessFaceUrl: 100 returns smile', () => {
	expect(happinessFaceUrl(100)).toBe('assets/face-smile-2.png')
})

test('happinessFaceUrl: 67 returns smile (above grim threshold)', () => {
	expect(happinessFaceUrl(67)).toBe('assets/face-smile-2.png')
})

test('happinessFaceUrl: 66 returns grim (at grim threshold)', () => {
	expect(happinessFaceUrl(66)).toBe('assets/face-grim-2.png')
})

test('happinessFaceUrl: 34 returns grim (above sad threshold)', () => {
	expect(happinessFaceUrl(34)).toBe('assets/face-grim-2.png')
})

test('happinessFaceUrl: 33 returns sad (at sad threshold)', () => {
	expect(happinessFaceUrl(33)).toBe('assets/face-sad-2.png')
})

test('happinessFaceUrl: 0 returns sad', () => {
	expect(happinessFaceUrl(0)).toBe('assets/face-sad-2.png')
})

test('statsIconUrl: stats cursor returns selected', () => {
	expect(statsIconUrl('stats')).toBe('assets/icon-stats-selected.png')
})

test('statsIconUrl: feed cursor returns normal', () => {
	expect(statsIconUrl('feed')).toBe('assets/icon-stats-normal.png')
})

test('statsIconUrl: clean cursor returns normal', () => {
	expect(statsIconUrl('clean')).toBe('assets/icon-stats-normal.png')
})

test('petAnimSpec: rejection (no action) returns shake frames', () => {
	const s = pet({ rejection: { until: 999999 } })
	const spec = petAnimSpec(s)
	expect(spec.urls).toEqual([
		'assets/pet-shake-0.png',
		'assets/pet-shake-1.png',
	])
})

test('petAnimSpec: rejection wins over hunger=0', () => {
	const s = pet({ hunger: 0, rejection: { until: 999999 } })
	const spec = petAnimSpec(s)
	expect(spec.urls[0]).toBe('assets/pet-shake-0.png')
})

test('petAnimSpec: action wins over rejection', () => {
	const s = pet({
		action: { kind: 'feed', until: 999999 },
		rejection: { until: 999999 },
	})
	const spec = petAnimSpec(s)
	expect(spec.urls[0]).toBe('assets/pet-eating-0.png')
})
