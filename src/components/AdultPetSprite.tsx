import { Image, Time, ZStack } from 'await'
import {
	AdultBodyState,
	AdultFaceExpression,
	adultBackUrls,
	adultBodyMaskUrls,
	adultBodyUrls,
	adultFaceUrl,
	adultHeadOffsetRows,
	adultHeadUrl,
} from '../assets'
import { GameState } from '../state'

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

// The pet renders into a 40-cell logical canvas. Body/face/head/body-mask
// stay 24×24 bitmaps and are framed at side×24/40, ZStack-centered. Wings
// are 40×40 and fill the canvas, so they have ~1.7× the area of the body
// to extend into.
const CANVAS_CELLS = 40
const BODY_CELLS = 24

type Props = {
	state: GameState
	side: number
	offsetY: number
}

export function AdultPetSprite({ state, side, offsetY }: Props) {
	if (
		state.adultBody === undefined ||
		state.adultFace === undefined ||
		state.adultHead === undefined ||
		state.adultBack === undefined
	) {
		return undefined
	}

	const bodyState = petAdultBodyState(state)
	const faceExpression = petAdultFaceExpression(state)
	const shaking = petAdultIsShaking(state)

	const bodyUrls = adultBodyUrls(state.adultBody, bodyState)
	const bodyMaskUrls = adultBodyMaskUrls(state.adultBody, bodyState)
	const faceUrl = adultFaceUrl(state.adultFace, faceExpression)
	const headUrl = adultHeadUrl(state.adultHead)
	const backUrls = adultBackUrls(state.adultBack)

	// Pixel sizes: one canvas cell, and the rendered body footprint.
	const cellPx = side / CANVAS_CELLS
	const bodySide = cellPx * BODY_CELLS
	const headOffsetY = adultHeadOffsetRows(state.adultBody) * cellPx

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

	const faceShakeOffsetA = shaking ? -side * 0.08 : 0
	const faceShakeOffsetB = shaking ? side * 0.08 : 0

	// Breathing: bob the pet down one canvas cell on frame 1. The fs02 mask
	// flips frame 0/1 at ~1Hz so the pet reads as inhaling/exhaling.
	const breathOffset = cellPx

	const layeredFrame = (frameIndex: 0 | 1) => {
		const layers: NativeView[] = []
		const breathY = frameIndex === 0 ? 0 : breathOffset
		// Wings (behind everything, full canvas) → body-shaped LED_BG occluder
		// → body silhouette → face → head. The occluder paints background
		// over wing pixels that fall inside the body bounds.
		if (backUrls) {
			layers.push(
				<Image
					url={backUrls[frameIndex]}
					resizable
					interpolation='none'
					frame={{ width: side, height: side }}
					offset={{ x: 0, y: breathY }}
				/>,
			)
			layers.push(
				<Image
					url={bodyMaskUrls[frameIndex]}
					resizable
					interpolation='none'
					frame={{ width: bodySide, height: bodySide }}
					offset={{ x: 0, y: breathY }}
				/>,
			)
		}
		layers.push(
			<Image
				url={bodyUrls[frameIndex]}
				resizable
				interpolation='none'
				frame={{ width: bodySide, height: bodySide }}
				offset={{ x: 0, y: breathY }}
			/>,
		)
		layers.push(
			<Image
				url={faceUrl}
				resizable
				interpolation='none'
				frame={{ width: bodySide, height: bodySide }}
				offset={{
					x: frameIndex === 0 ? faceShakeOffsetA : faceShakeOffsetB,
					y: breathY,
				}}
			/>,
		)
		if (headUrl) {
			layers.push(
				<Image
					url={headUrl}
					resizable
					interpolation='none'
					frame={{ width: bodySide, height: bodySide }}
					offset={{ x: 0, y: headOffsetY + breathY }}
				/>,
			)
		}
		return layers
	}

	return (
		<ZStack offset={{ x: 0, y: offsetY }}>
			<ZStack mask={phaseAt(0)}>{layeredFrame(0)}</ZStack>
			<ZStack mask={phaseAt(1)}>{layeredFrame(1)}</ZStack>
		</ZStack>
	)
}
