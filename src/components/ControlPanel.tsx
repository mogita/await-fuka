import { Button, HStack, Text } from 'await'
import { Direction } from '../layout'

type Props = {
	direction: Direction
	controlSize: number
	cycle: IntentInfo
	execute: IntentInfo
	cancel: IntentInfo
}

export function ControlPanel({
	direction,
	controlSize,
	cycle,
	execute,
	cancel,
}: Props) {
	const buttons = [
		{ label: 'A', intent: cycle },
		{ label: 'B', intent: execute },
		{ label: 'C', intent: cancel },
	]

	// Constrain the strip's short axis. The long axis stays free to fill the
	// widget. Without this, the strip absorbs all leftover space and dwarfs the
	// intended thickness.
	const frame =
		direction === 'horizontal'
			? { width: controlSize }
			: { height: controlSize }

	return (
		<HStack spacing={0} background={0.1} frame={frame}>
			{buttons.map((b) => (
				<Button intent={b.intent} maxWidth maxHeight>
					<Text value={b.label} foreground={0.9} fontWeight={700} />
				</Button>
			))}
		</HStack>
	)
}
