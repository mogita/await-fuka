import { HStack, Image, ZStack } from 'await'
import { cleanIconUrl, feedIconUrl, statsIconUrl } from '../assets'
import { LED_BG } from '../config'
import { GameState } from '../state'

const ICON_W_PCT = 0.25
const ICON_H_PCT = 0.125
const GAP_PCT = 0.08

type Props = { state: GameState; side: number }

export function MenuScreen({ state, side }: Props) {
	const w = side * ICON_W_PCT
	const h = side * ICON_H_PCT
	const gap = side * GAP_PCT
	return (
		<ZStack maxSides background={LED_BG}>
			<HStack spacing={gap}>
				<Image
					url={feedIconUrl(state.menuCursor)}
					resizable
					interpolation='none'
					frame={{ width: w, height: h }}
				/>
				<Image
					url={cleanIconUrl(state.menuCursor)}
					resizable
					interpolation='none'
					frame={{ width: w, height: h }}
				/>
				<Image
					url={statsIconUrl(state.menuCursor)}
					resizable
					interpolation='none'
					frame={{ width: w, height: h }}
				/>
			</HStack>
		</ZStack>
	)
}
