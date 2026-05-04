import { HStack, Image, Rectangle, Time, ZStack } from 'await'
import {
	HEART_FILLED_URL,
	HEART_HOLLOW_URL,
	POOP_URL,
	petAnimSpec,
} from '../assets'
import { HUNGER_MAX, LED_BG, LED_FG } from '../config'
import { GameState } from '../state'
import { AdultPetSprite } from './AdultPetSprite'

const PET_SIZE_PCT = 0.5
const PET_CENTER_Y_PCT = 0.4
const POOP_SIZE_PCT = 0.18
const POOP_OFFSET_X_PCT = 0.36
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
	const isPet = state.stage !== 'egg'
	const petSize = side * PET_SIZE_PCT
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

	const pet =
		state.stage === 'adult' ? (
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
