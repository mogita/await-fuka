import { VStack, HStack, ZStack, Image, Text } from 'await'
import { GameState } from '../state'
import {
	HEART_FILLED_URL,
	HEART_HOLLOW_URL,
	happinessFaceUrl,
} from '../assets'
import { HUNGER_MAX, LED_BG, LED_FG, worldSpeed } from '../config'
import { formatAge } from '../age'

const STATS_HEART_SIZE_PCT = 0.09
const STATS_HEART_GAP_PCT = 0.025
const FACE_SIZE_PCT = 0.22
const ROW_GAP_PCT = 0.05

type Props = { state: GameState; side: number }

export function StatsScreen({ state, side }: Props) {
	const heartSize = side * STATS_HEART_SIZE_PCT
	const heartGap = side * STATS_HEART_GAP_PCT
	const faceSize = side * FACE_SIZE_PCT
	const rowGap = side * ROW_GAP_PCT

	const slots: number[] = []
	for (let i = 0; i < HUNGER_MAX; i++) slots.push(i)
	const hungerRow = (
		<HStack spacing={heartGap}>
			{slots.map((i) => (
				<Image
					url={i < state.hunger ? HEART_FILLED_URL : HEART_HOLLOW_URL}
					resizable
					interpolation='none'
					frame={{ width: heartSize, height: heartSize }}
				/>
			))}
		</HStack>
	)

	const faceRow = (
		<Image
			url={happinessFaceUrl(state.happiness)}
			resizable
			interpolation='none'
			frame={{ width: faceSize, height: faceSize }}
		/>
	)

	const weightText = `${state.weight.toFixed(2)} kg`
	const weightRow = (
		<Text
			value={weightText}
			foreground={LED_FG}
			fontWeight={700}
			minimumScaleFactor={0.5}
		/>
	)

	const now = Date.now()
	const ageRow = (
		<Text
			value={formatAge((now - state.bornAt) * worldSpeed)}
			foreground={LED_FG}
			fontWeight={700}
			minimumScaleFactor={0.5}
		/>
	)

	return (
		<ZStack maxSides background={LED_BG}>
			<VStack spacing={rowGap}>
				{hungerRow}
				{faceRow}
				{weightRow}
				{ageRow}
			</VStack>
		</ZStack>
	)
}
