import { HAPPY_THRESHOLDS } from './config'
import {
	BodyArchetype,
	FacePersonality,
	GameState,
	HeadAttachment,
	MenuCursor,
} from './state'

export type PetAnimSpec = {
	urls: readonly [string, string]
}

const PET_EGG_URLS = ['assets/pet-egg-0.png', 'assets/pet-egg-1.png'] as const
const PET_IDLE_URLS = [
	'assets/pet-idle-0.png',
	'assets/pet-idle-1.png',
] as const
const PET_HUNGRY_URLS = [
	'assets/pet-hungry-0.png',
	'assets/pet-hungry-1.png',
] as const
const PET_HAPPY_URLS = [
	'assets/pet-happy-0.png',
	'assets/pet-happy-1.png',
] as const
const PET_EATING_URLS = [
	'assets/pet-eating-0.png',
	'assets/pet-eating-2.png',
] as const
const PET_SHAKE_URLS = [
	'assets/pet-shake-0.png',
	'assets/pet-shake-1.png',
] as const

export function petAnimSpec(state: GameState): PetAnimSpec {
	if (state.stage === 'egg') return { urls: PET_EGG_URLS }
	if (state.action?.kind === 'feed') return { urls: PET_EATING_URLS }
	if (state.action?.kind === 'clean') return { urls: PET_HAPPY_URLS }
	if (state.rejection !== undefined) return { urls: PET_SHAKE_URLS }
	if (state.hunger === 0) return { urls: PET_HUNGRY_URLS }
	return { urls: PET_IDLE_URLS }
}

export function feedIconUrl(cursor: MenuCursor): string {
	return cursor === 'feed'
		? 'assets/icon-feed-selected.png'
		: 'assets/icon-feed-normal.png'
}

export function cleanIconUrl(cursor: MenuCursor): string {
	return cursor === 'clean'
		? 'assets/icon-clean-selected.png'
		: 'assets/icon-clean-normal.png'
}

export function statsIconUrl(cursor: MenuCursor): string {
	return cursor === 'stats'
		? 'assets/icon-stats-selected.png'
		: 'assets/icon-stats-normal.png'
}

export function happinessFaceUrl(value: number): string {
	if (value <= HAPPY_THRESHOLDS.sad) return 'assets/face-sad.png'
	if (value <= HAPPY_THRESHOLDS.grim) return 'assets/face-grim.png'
	return 'assets/face-smile.png'
}

export const POOP_URL = 'assets/poop.png'
export const HEART_FILLED_URL = 'assets/heart-filled.png'
export const HEART_HOLLOW_URL = 'assets/heart-hollow.png'

export type AdultBodyState = 'idle' | 'eating' | 'cleaning' | 'hungry'
export type AdultFaceExpression = 'resting' | 'active'

export function adultBodyUrls(
	archetype: BodyArchetype,
	state: AdultBodyState,
): readonly [string, string] {
	return [
		`assets/body-${archetype}-${state}-0.png`,
		`assets/body-${archetype}-${state}-1.png`,
	]
}

// Vertical offset (in 24-cell rows) of each archetype's head TOP within its
// bitmap. Head attachments (halo, horns, crown, plant) are authored with
// their attach line at row 0, so non-zero offsets shift the attachment down
// to meet the actual head dome of that archetype.
const ADULT_HEAD_TOP_ROW: Record<BodyArchetype, number> = {
	'roly-poly': 0,
	'lanky-blob': 0,
	'lean-spike': 0,
	'stout-rock': 4,
}

export function adultHeadOffsetRows(archetype: BodyArchetype): number {
	return ADULT_HEAD_TOP_ROW[archetype]
}

export function adultFaceUrl(
	personality: FacePersonality,
	expression: AdultFaceExpression,
): string {
	return `assets/face-${personality}-${expression}.png`
}

export function adultHeadUrl(attachment: HeadAttachment): string | undefined {
	if (attachment === 'bare') return undefined
	return `assets/head-${attachment}.png`
}
