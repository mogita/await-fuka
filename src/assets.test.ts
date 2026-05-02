import { expect, test } from 'bun:test'
import {
	adultBackUrls,
	adultBodyUrls,
	adultFaceUrl,
	adultHeadUrl,
	cleanIconUrl,
	feedIconUrl,
	happinessFaceUrl,
	petAnimSpec,
	statsIconUrl,
} from './assets'
import { freshState, GameState } from './state'

function pet(overrides: Partial<GameState> = {}): GameState {
	return { ...freshState(0), stage: 'youth', ...overrides }
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
	expect(happinessFaceUrl(100)).toBe('assets/face-smile.png')
})

test('happinessFaceUrl: 67 returns smile (above grim threshold)', () => {
	expect(happinessFaceUrl(67)).toBe('assets/face-smile.png')
})

test('happinessFaceUrl: 66 returns grim (at grim threshold)', () => {
	expect(happinessFaceUrl(66)).toBe('assets/face-grim.png')
})

test('happinessFaceUrl: 34 returns grim (above sad threshold)', () => {
	expect(happinessFaceUrl(34)).toBe('assets/face-grim.png')
})

test('happinessFaceUrl: 33 returns sad (at sad threshold)', () => {
	expect(happinessFaceUrl(33)).toBe('assets/face-sad.png')
})

test('happinessFaceUrl: 0 returns sad', () => {
	expect(happinessFaceUrl(0)).toBe('assets/face-sad.png')
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

test('adultBodyUrls: returns 2-frame body URLs for archetype + state', () => {
	expect(adultBodyUrls('roly-poly', 'idle')).toEqual([
		'assets/body-roly-poly-idle-0.png',
		'assets/body-roly-poly-idle-1.png',
	])
	expect(adultBodyUrls('lanky-blob', 'eating')).toEqual([
		'assets/body-lanky-blob-eating-0.png',
		'assets/body-lanky-blob-eating-1.png',
	])
})

test('adultFaceUrl: returns face URL for personality + expression', () => {
	expect(adultFaceUrl('cheerful', 'resting')).toBe(
		'assets/face-cheerful-resting.png',
	)
	expect(adultFaceUrl('grumpy', 'active')).toBe('assets/face-grumpy-active.png')
})

test('adultHeadUrl: returns URL for non-bare attachments, undefined for bare', () => {
	expect(adultHeadUrl('halo')).toBe('assets/head-halo.png')
	expect(adultHeadUrl('horns')).toBe('assets/head-horns.png')
	expect(adultHeadUrl('crown')).toBe('assets/head-crown.png')
	expect(adultHeadUrl('plant')).toBe('assets/head-plant.png')
	expect(adultHeadUrl('bare')).toBeUndefined()
})

test('adultBackUrls: returns 2-frame URLs for non-bare wings, undefined for bare', () => {
	expect(adultBackUrls('feathered')).toEqual([
		'assets/back-feathered-0.png',
		'assets/back-feathered-1.png',
	])
	expect(adultBackUrls('bat')).toEqual([
		'assets/back-bat-0.png',
		'assets/back-bat-1.png',
	])
	expect(adultBackUrls('bare')).toBeUndefined()
})
