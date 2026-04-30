import { ZStack, HStack, VStack, Image, Text } from 'await'
import { GameState } from './state'
import { layoutFor } from './layout'
import { ControlPanel } from './components/ControlPanel'
import { PetScreen } from './components/PetScreen'
import { feedIconUrl, cleanIconUrl } from './assets'
import { LED_BG, LED_FG } from './config'

export type WidgetProps = {
	family: WidgetFamily
	size: Size
	gameState: GameState
	cycleIntent: IntentInfo
	executeIntent: IntentInfo
	cancelIntent: IntentInfo
}

function MenuPlaceholder({ state, side }: { state: GameState; side: number }) {
	// Real menu lands in Task 11.
	return (
		<ZStack maxSides background={LED_BG}>
			<HStack spacing={side * 0.05}>
				<Image
					url={feedIconUrl(state.menuCursor)}
					resizable
					interpolation='none'
					frame={{ width: side * 0.25, height: side * 0.125 }}
				/>
				<Image
					url={cleanIconUrl(state.menuCursor)}
					resizable
					interpolation='none'
					frame={{ width: side * 0.25, height: side * 0.125 }}
				/>
			</HStack>
		</ZStack>
	)
}

function StatsPlaceholder({ side }: { side: number }) {
	// Real stats lands in Task 13.
	return (
		<ZStack maxSides background={LED_BG}>
			<Text value='STATS' foreground={LED_FG} minimumScaleFactor={0.5} />
		</ZStack>
	)
}

function ScreenArea({ state, side }: { state: GameState; side: number }) {
	if (state.screen === 'menu') return <MenuPlaceholder state={state} side={side} />
	if (state.screen === 'stats') return <StatsPlaceholder side={side} />
	return <PetScreen state={state} side={side} />
}

export function widget(props: WidgetProps) {
	const { gameState, cycleIntent, executeIntent, cancelIntent, family, size } =
		props
	const layout = layoutFor(family, size)

	const screen = <ScreenArea state={gameState} side={layout.screenSide} />
	const controls = (
		<ControlPanel
			direction={layout.direction}
			controlSize={layout.controlSize}
			cycle={cycleIntent}
			execute={executeIntent}
			cancel={cancelIntent}
		/>
	)

	if (layout.direction === 'horizontal') {
		return (
			<ZStack>
				<HStack spacing={0}>
					{screen}
					{controls}
				</HStack>
			</ZStack>
		)
	}

	return (
		<ZStack>
			<VStack spacing={0}>
				{screen}
				{controls}
			</VStack>
		</ZStack>
	)
}
