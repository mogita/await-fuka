import { Image, Time, ZStack } from 'await'
import {
	AdultBodyState,
	AdultFaceExpression,
	adultBackUrls,
	adultBodyUrls,
	adultFaceUrl,
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
	const faceUrl = adultFaceUrl(state.adultFace, faceExpression)
	const headUrl = adultHeadUrl(state.adultHead)
	const backUrls = adultBackUrls(state.adultBack)

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

	const layeredFrame = (frameIndex: 0 | 1) => {
		const layers: NativeView[] = []
		if (backUrls) {
			layers.push(
				<Image
					url={backUrls[frameIndex]}
					resizable
					interpolation='none'
					frame={{ width: side, height: side }}
				/>,
			)
		}
		layers.push(
			<Image
				url={bodyUrls[frameIndex]}
				resizable
				interpolation='none'
				frame={{ width: side, height: side }}
			/>,
		)
		layers.push(
			<Image
				url={faceUrl}
				resizable
				interpolation='none'
				frame={{ width: side, height: side }}
				offset={{
					x: frameIndex === 0 ? faceShakeOffsetA : faceShakeOffsetB,
					y: 0,
				}}
			/>,
		)
		if (headUrl) {
			layers.push(
				<Image
					url={headUrl}
					resizable
					interpolation='none'
					frame={{ width: side, height: side }}
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
