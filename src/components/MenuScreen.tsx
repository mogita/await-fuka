import { HStack, Image, ZStack } from 'await'
import { cleanIconUrl, feedIconUrl, statsIconUrl } from '../assets'
import { LED_BG } from '../config'
import { GameState } from '../state'

// Icons are 10×10 square sprites; the frame must keep that aspect or the
// pixel art renders squished. 0.20 × 0.20 keeps each on-screen pixel close
// to the size it had in the previous 12×6 layout (~2.0% of side per source
// pixel, vs ~2.08% before).
const ICON_SIZE_PCT = 0.2
const GAP_PCT = 0.08

type Props = { state: GameState; side: number }

export function MenuScreen({ state, side }: Props) {
	const s = side * ICON_SIZE_PCT
	const gap = side * GAP_PCT
	return (
		<ZStack maxSides background={LED_BG}>
			<HStack spacing={gap}>
				<Image
					url={feedIconUrl(state.menuCursor)}
					resizable
					interpolation='none'
					frame={{ width: s, height: s }}
				/>
				<Image
					url={cleanIconUrl(state.menuCursor)}
					resizable
					interpolation='none'
					frame={{ width: s, height: s }}
				/>
				<Image
					url={statsIconUrl(state.menuCursor)}
					resizable
					interpolation='none'
					frame={{ width: s, height: s }}
				/>
			</HStack>
		</ZStack>
	)
}
