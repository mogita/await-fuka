import { expect, test } from 'bun:test'
import { formatAge } from './age'

test('formatAge: 0 ms returns 0m', () => {
	expect(formatAge(0)).toBe('0m')
})

test('formatAge: less than 1 minute returns 0m', () => {
	expect(formatAge(30 * 1000)).toBe('0m')
})

test('formatAge: under 1 hour returns Xm', () => {
	expect(formatAge(45 * 60 * 1000)).toBe('45m')
})

test('formatAge: 59 minutes returns 59m', () => {
	expect(formatAge(59 * 60 * 1000)).toBe('59m')
})

test('formatAge: exactly 1 hour returns 0d 1h', () => {
	expect(formatAge(60 * 60 * 1000)).toBe('0d 1h')
})

test('formatAge: 3 hours returns 0d 3h', () => {
	expect(formatAge(3 * 60 * 60 * 1000)).toBe('0d 3h')
})

test('formatAge: 1 day 2 hours returns 1d 2h', () => {
	expect(formatAge((24 + 2) * 60 * 60 * 1000)).toBe('1d 2h')
})

test('formatAge: 365 days returns 365d 0h', () => {
	expect(formatAge(365 * 24 * 60 * 60 * 1000)).toBe('365d 0h')
})

test('formatAge: negative input clamped to 0m', () => {
	expect(formatAge(-1000)).toBe('0m')
})
