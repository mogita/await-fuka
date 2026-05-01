import { HStack, VStack, ZStack } from 'await'
import { ControlPanel } from './components/ControlPanel'
import { MenuScreen } from './components/MenuScreen'
import { PetScreen } from './components/PetScreen'
import { StatsScreen } from './components/StatsScreen'
import { layoutFor } from './layout'
import { GameState } from './state'

export type WidgetProps = {
	family: WidgetFamily
	size: Size
	gameState: GameState
	cycleIntent: IntentInfo
	executeIntent: IntentInfo
	cancelIntent: IntentInfo
}

function ScreenArea({ state, side }: { state: GameState; side: number }) {
	if (state.screen === 'menu') return <MenuScreen state={state} side={side} />
	if (state.screen === 'stats') return <StatsScreen state={state} side={side} />
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
