import { expect, test } from 'bun:test'
import {
	HATCH_DURATION_MS,
	HUNGER_INTERVAL_MS,
	MAX_WEIGHT_LOSS_PER_HR,
	POOP_INTERVAL_MS,
	WEIGHT_FLOOR,
} from './config'
import { freshState } from './state'
import { nextInterestingMoment, tick } from './tick'

test('tick: stays as egg before hatch duration', () => {
	const s = freshState(0)
	const t = tick(s, HATCH_DURATION_MS - 1, 1)
	expect(t.stage).toBe('egg')
})

test('tick: hatches at hatch duration', () => {
	const s = freshState(0)
	const t = tick(s, HATCH_DURATION_MS, 1)
	expect(t.stage).toBe('pet')
	expect(t.lastHungerCheckAt).toBe(HATCH_DURATION_MS)
	expect(t.lastPoopCheckAt).toBe(HATCH_DURATION_MS)
})

test('tick: worldSpeed accelerates hatch', () => {
	const s = freshState(0)
	const t = tick(s, HATCH_DURATION_MS / 100, 100)
	expect(t.stage).toBe('pet')
})

test('tick: pet hunger decays one heart per interval', () => {
	let s = freshState(0)
	s = tick(s, HATCH_DURATION_MS, 1) // hatch first
	s = tick(s, HATCH_DURATION_MS + HUNGER_INTERVAL_MS, 1)
	expect(s.hunger).toBe(4)
})

test('tick: pet hunger decays multiple intervals at once', () => {
	let s = freshState(0)
	s = tick(s, HATCH_DURATION_MS, 1)
	s = tick(s, HATCH_DURATION_MS + HUNGER_INTERVAL_MS * 2, 1)
	expect(s.hunger).toBe(3)
})

test('tick: pet hunger preserves fractional progress', () => {
	let s = freshState(0)
	s = tick(s, HATCH_DURATION_MS, 1)
	// 1.5 intervals: drop 1 heart, lastHungerCheckAt advances by 1 interval
	s = tick(s, HATCH_DURATION_MS + HUNGER_INTERVAL_MS * 1.5, 1)
	expect(s.hunger).toBe(4)
	expect(s.lastHungerCheckAt).toBe(HATCH_DURATION_MS + HUNGER_INTERVAL_MS)
})

test('tick: hunger clamped at 0', () => {
	let s = freshState(0)
	s = tick(s, HATCH_DURATION_MS, 1)
	s = tick(s, HATCH_DURATION_MS + HUNGER_INTERVAL_MS * 5, 1)
	expect(s.hunger).toBe(0)
})

test('tick: poop appears after interval', () => {
	let s = freshState(0)
	s = tick(s, HATCH_DURATION_MS, 1)
	s = tick(s, HATCH_DURATION_MS + POOP_INTERVAL_MS, 1)
	expect(s.hasPoop).toBe(true)
	expect(s.lastPoopCheckAt).toBe(HATCH_DURATION_MS + POOP_INTERVAL_MS)
})

test('tick: poop does not duplicate', () => {
	let s = freshState(0)
	s = tick(s, HATCH_DURATION_MS, 1)
	s = { ...s, hasPoop: true }
	const before = s.lastPoopCheckAt
	s = tick(s, HATCH_DURATION_MS + POOP_INTERVAL_MS * 2, 1)
	expect(s.hasPoop).toBe(true)
	expect(s.lastPoopCheckAt).toBe(before)
})

test('tick: action clears when expired', () => {
	let s = freshState(0)
	s = tick(s, HATCH_DURATION_MS, 1)
	s = { ...s, action: { kind: 'feed', until: HATCH_DURATION_MS + 100 } }
	s = tick(s, HATCH_DURATION_MS + 100, 1)
	expect(s.action).toBeUndefined()
})

test('tick: action persists when not expired', () => {
	let s = freshState(0)
	s = tick(s, HATCH_DURATION_MS, 1)
	const action = { kind: 'feed' as const, until: HATCH_DURATION_MS + 1000 }
	s = { ...s, action }
	s = tick(s, HATCH_DURATION_MS + 500, 1)
	expect(s.action).toEqual(action)
})

test('tick: idempotent on already-current state', () => {
	let s = freshState(0)
	s = tick(s, HATCH_DURATION_MS + HUNGER_INTERVAL_MS * 0.3, 1)
	const s2 = tick(s, HATCH_DURATION_MS + HUNGER_INTERVAL_MS * 0.3, 1)
	expect(s2).toEqual(s)
})

test('nextInterestingMoment: returns hatch time when egg', () => {
	const s = freshState(0)
	expect(nextInterestingMoment(s, 0, 1)).toBe(HATCH_DURATION_MS)
})

test('nextInterestingMoment: returns scaled hatch time when worldSpeed > 1', () => {
	const s = freshState(0)
	expect(nextInterestingMoment(s, 0, 100)).toBe(HATCH_DURATION_MS / 100)
})

test('nextInterestingMoment: returns next hunger tick when pet', () => {
	let s = freshState(0)
	s = tick(s, HATCH_DURATION_MS, 1)
	expect(nextInterestingMoment(s, HATCH_DURATION_MS, 1)).toBe(
		HATCH_DURATION_MS + HUNGER_INTERVAL_MS,
	)
})

test('nextInterestingMoment: returns next poop time when no poop and hunger=0', () => {
	let s = freshState(0)
	s = tick(s, HATCH_DURATION_MS, 1)
	s = { ...s, hunger: 0 }
	expect(nextInterestingMoment(s, HATCH_DURATION_MS, 1)).toBe(
		HATCH_DURATION_MS + POOP_INTERVAL_MS,
	)
})

test('nextInterestingMoment: returns action.until when set and earliest', () => {
	let s = freshState(0)
	s = tick(s, HATCH_DURATION_MS, 1)
	const until = HATCH_DURATION_MS + 100
	s = { ...s, action: { kind: 'feed', until } }
	expect(nextInterestingMoment(s, HATCH_DURATION_MS, 1)).toBe(until)
})

test('nextInterestingMoment: returns minimum across multiple candidates', () => {
	let s = freshState(0)
	s = tick(s, HATCH_DURATION_MS, 1)
	// hunger > 0 (next tick = HATCH_DURATION_MS + HUNGER_INTERVAL_MS),
	// !hasPoop (next tick = HATCH_DURATION_MS + POOP_INTERVAL_MS),
	// action.until is earlier than both, so it should win.
	s = { ...s, action: { kind: 'feed', until: HATCH_DURATION_MS + 100 } }
	expect(nextInterestingMoment(s, HATCH_DURATION_MS, 1)).toBe(
		HATCH_DURATION_MS + 100,
	)
})

test('nextInterestingMoment: returns now + 1h fallback when nothing pending', () => {
	let s = freshState(0)
	s = tick(s, HATCH_DURATION_MS, 1)
	s = { ...s, hunger: 0, hasPoop: true }
	const now = HATCH_DURATION_MS + 1000
	expect(nextInterestingMoment(s, now, 1)).toBe(now + 60 * 60 * 1000)
})

test('tick: hatch seeds bornAt and weightLastCheckAt at hatchAt', () => {
	const s = freshState(0)
	const t = tick(s, HATCH_DURATION_MS, 1)
	expect(t.bornAt).toBe(HATCH_DURATION_MS)
	expect(t.weightLastCheckAt).toBe(HATCH_DURATION_MS)
	expect(t.lastHungerCheckAt).toBe(HATCH_DURATION_MS)
	expect(t.lastPoopCheckAt).toBe(HATCH_DURATION_MS)
})

test('tick: hunger reaching 0 sets hungerZeroSince to the boundary', () => {
	let s = freshState(0)
	s = tick(s, HATCH_DURATION_MS, 1)
	s = tick(s, HATCH_DURATION_MS + HUNGER_INTERVAL_MS * 5, 1)
	expect(s.hunger).toBe(0)
	expect(s.hungerZeroSince).toBe(HATCH_DURATION_MS + HUNGER_INTERVAL_MS * 5)
})

test('tick: hunger leaving 0 clears hungerZeroSince', () => {
	let s = freshState(0)
	s = tick(s, HATCH_DURATION_MS, 1)
	s = tick(s, HATCH_DURATION_MS + HUNGER_INTERVAL_MS * 5, 1) // hunger -> 0
	s = { ...s, hunger: 2 } // simulate a feed
	s = tick(s, HATCH_DURATION_MS + HUNGER_INTERVAL_MS * 5 + 1, 1)
	expect(s.hungerZeroSince).toBeUndefined()
})

test('tick: hunger->0 aligns weightLastCheckAt to the boundary (no retro-growth)', () => {
	// Pet hatches and is well-fed for 10 intervals, then hunger drops to 0
	// in a single elapsed tick. weightLastCheckAt was set at hatch and might
	// be far in the past relative to hungerZeroSince. After the transition,
	// both must align so the shrink loop never sees pre-zero boundaries.
	let s = freshState(0)
	s = tick(s, HATCH_DURATION_MS, 1)
	const startWeight = s.weight
	s = tick(s, HATCH_DURATION_MS + HUNGER_INTERVAL_MS * 10, 1)
	expect(s.hunger).toBe(0)
	expect(s.weightLastCheckAt).toBe(s.hungerZeroSince!)
	// On the same tick, the alignment moves the cursor to the hunger-zero
	// boundary; no full interval has elapsed since alignment, so weight
	// should be unchanged.
	expect(s.weight).toBe(startWeight)
})

test('tick: weight shrinks while hunger=0, scaled by size and time ramp', () => {
	let s = freshState(0)
	s = tick(s, HATCH_DURATION_MS, 1)
	s = { ...s, hunger: 0, weight: 10, hungerZeroSince: HATCH_DURATION_MS }
	const oneHour = HUNGER_INTERVAL_MS
	s = tick(s, HATCH_DURATION_MS + oneHour, 1)
	// expected: 1 boundary; hoursAtZero=1; timeRamp=1-exp(-1/24); sizeFactor=1.
	const expectedDelta = MAX_WEIGHT_LOSS_PER_HR * (1 - Math.exp(-1 / 24)) * 1
	expect(s.weight).toBeCloseTo(10 - expectedDelta, 6)
	expect(s.weightLastCheckAt).toBe(HATCH_DURATION_MS + oneHour)
})

test('tick: small pet shrinks much slower (size_factor < 1)', () => {
	let s = freshState(0)
	s = tick(s, HATCH_DURATION_MS, 1)
	s = { ...s, hunger: 0, weight: 1, hungerZeroSince: HATCH_DURATION_MS }
	s = tick(s, HATCH_DURATION_MS + HUNGER_INTERVAL_MS, 1)
	// sizeFactor = 1 / 10 = 0.1
	const expectedDelta = MAX_WEIGHT_LOSS_PER_HR * (1 - Math.exp(-1 / 24)) * 0.1
	expect(s.weight).toBeCloseTo(1 - expectedDelta, 6)
})

test('tick: weight floor enforced', () => {
	let s = freshState(0)
	s = tick(s, HATCH_DURATION_MS, 1)
	s = {
		...s,
		hunger: 0,
		weight: WEIGHT_FLOOR + 0.001,
		hungerZeroSince: HATCH_DURATION_MS,
	}
	// Many hours to force shrink past floor.
	s = tick(s, HATCH_DURATION_MS + HUNGER_INTERVAL_MS * 200, 1)
	expect(s.weight).toBe(WEIGHT_FLOOR)
})

test('tick: 30 days at hunger=0 with adult pet caps near 30kg loss', () => {
	let s = freshState(0)
	s = tick(s, HATCH_DURATION_MS, 1)
	s = {
		...s,
		hunger: 0,
		weight: 50,
		hungerZeroSince: HATCH_DURATION_MS,
	}
	const thirtyDays = HUNGER_INTERVAL_MS * 24 * 30
	s = tick(s, HATCH_DURATION_MS + thirtyDays, 1)
	// Loss capped near 30kg: at full ramp, ~1kg/day for 30 days; weight settles
	// somewhere around 50 - 30 (ramp + size_factor reductions while shrinking).
	expect(s.weight).toBeGreaterThanOrEqual(WEIGHT_FLOOR)
	expect(s.weight).toBeLessThan(50)
	expect(50 - s.weight).toBeLessThanOrEqual(31) // generous slack for ramp tail
})

test('tick: rejection clears when expired', () => {
	let s = freshState(0)
	s = tick(s, HATCH_DURATION_MS, 1)
	s = { ...s, rejection: { until: HATCH_DURATION_MS + 100 } }
	s = tick(s, HATCH_DURATION_MS + 100, 1)
	expect(s.rejection).toBeUndefined()
})

test('tick: rejection persists when not expired', () => {
	let s = freshState(0)
	s = tick(s, HATCH_DURATION_MS, 1)
	const rejection = { until: HATCH_DURATION_MS + 1000 }
	s = { ...s, rejection }
	s = tick(s, HATCH_DURATION_MS + 500, 1)
	expect(s.rejection).toEqual(rejection)
})

test('tick: idempotent on a starving pet', () => {
	let s = freshState(0)
	s = tick(s, HATCH_DURATION_MS, 1)
	s = { ...s, hunger: 0, hungerZeroSince: HATCH_DURATION_MS, weight: 5 }
	s = tick(s, HATCH_DURATION_MS + HUNGER_INTERVAL_MS * 1.5, 1)
	const s2 = tick(s, HATCH_DURATION_MS + HUNGER_INTERVAL_MS * 1.5, 1)
	expect(s2).toEqual(s)
})

test('nextInterestingMoment: includes weight boundary when starving', () => {
	let s = freshState(0)
	s = tick(s, HATCH_DURATION_MS, 1)
	s = {
		...s,
		hunger: 0,
		hungerZeroSince: HATCH_DURATION_MS,
		weightLastCheckAt: HATCH_DURATION_MS,
		hasPoop: true, // remove poop candidate
	}
	const next = nextInterestingMoment(s, HATCH_DURATION_MS, 1)
	expect(next).toBe(HATCH_DURATION_MS + HUNGER_INTERVAL_MS)
})

test('nextInterestingMoment: includes rejection expiry when set', () => {
	let s = freshState(0)
	s = tick(s, HATCH_DURATION_MS, 1)
	s = {
		...s,
		rejection: { until: HATCH_DURATION_MS + 100 },
	}
	expect(nextInterestingMoment(s, HATCH_DURATION_MS, 1)).toBe(
		HATCH_DURATION_MS + 100,
	)
})
