import { Image, Time, ZStack } from 'await'
import {
	AdultBodyState,
	AdultFaceExpression,
	adultBodyUrls,
	adultFaceUrl,
	moodFromHappiness,
} from '../assets'
import { debugBody, debugFace } from '../config'
import { BodyArchetype, GameState, Mood } from '../state'

function petAdultBodyState(state: GameState): AdultBodyState {
	if (state.action?.kind === 'feed') return 'eating'
	if (state.action?.kind === 'clean') return 'cleaning'
	if (state.hunger === 0) return 'hungry'
	return 'idle'
}

function petAdultFaceExpression(state: GameState): AdultFaceExpression {
	if (state.action !== undefined) return 'active'
	return 'resting'
}

function petAdultIsShaking(state: GameState): boolean {
	return state.rejection !== undefined && state.action === undefined
}

// Body and face are both 24x24 bitmaps filling the pet canvas; the face
// overlay paints onto the body's transparent face window (rows 7-13).
const BODY_CELLS = 24

// Default used when the pet hasn't evolved yet but a debug override forces the
// adult sprite. Pre-adult state has no adultBody, so pick something neutral.
const DEFAULT_BODY: BodyArchetype = 'roly-poly'

export function hasAdultDebugOverride(): boolean {
	return debugBody !== 'default' || debugFace !== 'default'
}

type Props = {
	state: GameState
	side: number
	offsetY: number
}

export function AdultPetSprite({ state, side, offsetY }: Props) {
	const adultBody: BodyArchetype =
		debugBody !== 'default'
			? (debugBody as BodyArchetype)
			: (state.adultBody ?? DEFAULT_BODY)
	// Face mood is live: derived from current happiness, or forced by the debug
	// override.
	const mood: Mood =
		debugFace !== 'default'
			? (debugFace as Mood)
			: moodFromHappiness(state.happiness)

	const bodyState = petAdultBodyState(state)
	const faceExpression = petAdultFaceExpression(state)
	const shaking = petAdultIsShaking(state)

	const bodyUrls = adultBodyUrls(adultBody, bodyState)
	const faceUrl = adultFaceUrl(mood, faceExpression)

	const cellPx = side / BODY_CELLS

	const baseDate = new Date()
	baseDate.setSeconds(0, 0)
	const phaseAt = (offsetSeconds: number) => (
		<Time
			date={new Date(baseDate.getTime() + offsetSeconds * 1000)}
			font={{ name: 'Widget', features: 'fs02', size: side }}
			sides={side}
			contentTransition='identity'
		/>
	)

	// Shake amplitude is body-relative so it reads the same at any render size.
	const faceShakeOffsetA = shaking ? -side * 0.08 : 0
	const faceShakeOffsetB = shaking ? side * 0.08 : 0

	// Breathing: bob the pet down one cell on frame 1. The fs02 mask flips
	// frame 0/1 at ~1Hz so the pet reads as inhaling/exhaling.
	const breathOffset = cellPx

	const layeredFrame = (frameIndex: 0 | 1): NativeView[] => {
		const breathY = frameIndex === 0 ? 0 : breathOffset
		// Body silhouette, then the face overlay on top.
		return [
			<Image
				url={bodyUrls[frameIndex]}
				resizable
				interpolation='none'
				frame={{ width: side, height: side }}
				offset={{ x: 0, y: breathY }}
			/>,
			<Image
				url={faceUrl}
				resizable
				interpolation='none'
				frame={{ width: side, height: side }}
				offset={{
					x: frameIndex === 0 ? faceShakeOffsetA : faceShakeOffsetB,
					y: breathY,
				}}
			/>,
		]
	}

	return (
		<ZStack offset={{ x: 0, y: offsetY }}>
			<ZStack mask={phaseAt(0)}>{layeredFrame(0)}</ZStack>
			<ZStack mask={phaseAt(1)}>{layeredFrame(1)}</ZStack>
		</ZStack>
	)
}
