import { HStack, Image, Rectangle, Time, ZStack } from 'await'
import {
	HEART_FILLED_URL,
	HEART_HOLLOW_URL,
	POOP_URL,
	petAnimSpec,
} from '../assets'
import { HUNGER_MAX, LED_BG, LED_FG } from '../config'
import { GameState } from '../state'
import { AdultPetSprite, hasAdultDebugOverride } from './AdultPetSprite'

const PET_SIZE_PCT = 0.5
// Adult pet renders into a 40-cell canvas containing a 24-cell body. Scale up
// so the body's visible size on the widget matches the youth pet — that
// leaves the wings to extend into the freed (40 - 24) cells of margin.
const ADULT_PET_SIZE_PCT = (PET_SIZE_PCT * 40) / 24
const PET_CENTER_Y_PCT = 0.4
const POOP_SIZE_PCT = 0.18
const POOP_OFFSET_X_PCT = 0.46
const POOP_OFFSET_Y_PCT = 0.2
const GROUND_Y_PCT = 0.73
const GROUND_HEIGHT_PCT = 0.012
const GROUND_WIDTH_PCT = 0.85
const HEART_ROW_Y_PCT = 0.85
const HEART_SIZE_PCT = 0.1
const HEART_GAP_PCT = 0.025

function buildPetAnim(
	state: GameState,
	side: number,
	offsetY: number,
): NativeView {
	const { urls } = petAnimSpec(state)
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
	return (
		<ZStack offset={{ x: 0, y: offsetY }}>
			<Image
				url={urls[0]}
				resizable
				interpolation='none'
				frame={{ width: side, height: side }}
				mask={phaseAt(0)}
			/>
			<Image
				url={urls[1]}
				resizable
				interpolation='none'
				frame={{ width: side, height: side }}
				mask={phaseAt(1)}
			/>
		</ZStack>
	)
}

type Props = { state: GameState; side: number }

export function PetScreen({ state, side }: Props) {
	// Debug overrides force the adult sprite regardless of game stage so any
	// variant can be previewed without waiting for the pet to grow up.
	const showAdult = state.stage === 'adult' || hasAdultDebugOverride()
	const isPet = state.stage !== 'egg' || showAdult
	const petSize = showAdult ? side * ADULT_PET_SIZE_PCT : side * PET_SIZE_PCT
	const petCenterY = side * PET_CENTER_Y_PCT
	const poopSize = side * POOP_SIZE_PCT
	const poopOffsetX = side * POOP_OFFSET_X_PCT
	const poopOffsetY = side * POOP_OFFSET_Y_PCT
	const groundY = side * GROUND_Y_PCT
	const groundHeight = Math.max(1, side * GROUND_HEIGHT_PCT)
	const groundWidth = side * GROUND_WIDTH_PCT
	const heartRowY = side * HEART_ROW_Y_PCT
	const heartSize = side * HEART_SIZE_PCT
	const heartGap = side * HEART_GAP_PCT
	const halfSide = side / 2

	const pet = showAdult ? (
		<AdultPetSprite
			state={state}
			side={petSize}
			offsetY={petCenterY - halfSide}
		/>
	) : (
		buildPetAnim(state, petSize, petCenterY - halfSide)
	)
	const poop =
		isPet && state.hasPoop ? (
			<Image
				url={POOP_URL}
				resizable
				interpolation='none'
				frame={{ width: poopSize, height: poopSize }}
				offset={{ x: poopOffsetX, y: petCenterY - halfSide + poopOffsetY }}
			/>
		) : undefined
	const ground = isPet ? (
		<Rectangle
			fill={LED_FG}
			opacity={0.4}
			frame={{ width: groundWidth, height: groundHeight }}
			offset={{ x: 0, y: groundY - halfSide }}
		/>
	) : undefined
	const heartSlots = Array.from({ length: HUNGER_MAX }, (_, i) => i)
	const hearts = isPet ? (
		<HStack spacing={heartGap} offset={{ x: 0, y: heartRowY - halfSide }}>
			{heartSlots.map((i) => (
				<Image
					url={i < state.hunger ? HEART_FILLED_URL : HEART_HOLLOW_URL}
					resizable
					interpolation='none'
					frame={{ width: heartSize, height: heartSize }}
				/>
			))}
		</HStack>
	) : undefined

	return (
		<ZStack maxSides background={LED_BG}>
			{pet}
			{poop}
			{ground}
			{hearts}
		</ZStack>
	)
}
