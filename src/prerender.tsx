import { VStack, HStack, Rectangle } from 'await'
import {
	eggAnim,
	petIdleAnim,
	petHungryAnim,
	petEatingAnim,
	petHappyAnim,
	petShakeAnim,
	poopSprite,
	feedIcon,
	cleanIcon,
	statsIcon,
	filledHeart,
	hollowHeart,
	faceSmile,
	faceGrim,
	faceSad,
} from './sprites'
import { LED_FG } from './config'

const CELL_SIZE = 8

function renderBitmap(
	sprite: readonly number[][],
	brightness: number = 1,
): NativeView {
	return (
		<VStack spacing={0}>
			{sprite.map((row) => (
				<HStack spacing={0}>
					{row.map((v) => {
						const lit = v > 0
						return (
							<Rectangle
								sides={CELL_SIZE}
								fill={lit ? LED_FG : ''}
								opacity={lit ? v * brightness : 0}
							/>
						)
					})}
				</HStack>
			))}
		</VStack>
	)
}

const ASSET_NAMES: readonly string[] = [
	'icon-feed-normal.png',
	'icon-feed-selected.png',
	'icon-clean-normal.png',
	'icon-clean-selected.png',
	'icon-stats-normal.png',
	'icon-stats-selected.png',
	'pet-egg-0.png',
	'pet-egg-1.png',
	'pet-idle-0.png',
	'pet-idle-1.png',
	'pet-hungry-0.png',
	'pet-hungry-1.png',
	'pet-eating-0.png',
	'pet-eating-1.png',
	'pet-eating-2.png',
	'pet-eating-3.png',
	'pet-happy-0.png',
	'pet-happy-1.png',
	'pet-shake-0.png',
	'pet-shake-1.png',
	'face-smile.png',
	'face-grim.png',
	'face-sad.png',
	'poop.png',
	'heart-filled.png',
	'heart-hollow.png',
]

export function preRender(): void {
	if (AwaitEnv.host === 'widget') return

	const fileSet = new Set(AwaitFile.files('assets'))
	const hasAll = ASSET_NAMES.every((name) => fileSet.has(`assets/${name}`))
	if (hasAll) return

	AwaitFile.saveUIRenderImage(
		'assets/icon-feed-normal.png',
		renderBitmap(feedIcon, 0.5),
	)
	AwaitFile.saveUIRenderImage(
		'assets/icon-feed-selected.png',
		renderBitmap(feedIcon, 1),
	)
	AwaitFile.saveUIRenderImage(
		'assets/icon-clean-normal.png',
		renderBitmap(cleanIcon, 0.5),
	)
	AwaitFile.saveUIRenderImage(
		'assets/icon-clean-selected.png',
		renderBitmap(cleanIcon, 1),
	)
	AwaitFile.saveUIRenderImage(
		'assets/icon-stats-normal.png',
		renderBitmap(statsIcon, 0.5),
	)
	AwaitFile.saveUIRenderImage(
		'assets/icon-stats-selected.png',
		renderBitmap(statsIcon, 1),
	)

	for (let i = 0; i < eggAnim.frames.length; i++) {
		AwaitFile.saveUIRenderImage(
			`assets/pet-egg-${i}.png`,
			renderBitmap(eggAnim.frames[i]!),
		)
	}
	for (let i = 0; i < petIdleAnim.frames.length; i++) {
		AwaitFile.saveUIRenderImage(
			`assets/pet-idle-${i}.png`,
			renderBitmap(petIdleAnim.frames[i]!),
		)
	}
	for (let i = 0; i < petHungryAnim.frames.length; i++) {
		AwaitFile.saveUIRenderImage(
			`assets/pet-hungry-${i}.png`,
			renderBitmap(petHungryAnim.frames[i]!),
		)
	}
	for (let i = 0; i < petEatingAnim.frames.length; i++) {
		AwaitFile.saveUIRenderImage(
			`assets/pet-eating-${i}.png`,
			renderBitmap(petEatingAnim.frames[i]!),
		)
	}
	for (let i = 0; i < petHappyAnim.frames.length; i++) {
		AwaitFile.saveUIRenderImage(
			`assets/pet-happy-${i}.png`,
			renderBitmap(petHappyAnim.frames[i]!),
		)
	}
	for (let i = 0; i < petShakeAnim.frames.length; i++) {
		AwaitFile.saveUIRenderImage(
			`assets/pet-shake-${i}.png`,
			renderBitmap(petShakeAnim.frames[i]!),
		)
	}

	AwaitFile.saveUIRenderImage('assets/face-smile.png', renderBitmap(faceSmile))
	AwaitFile.saveUIRenderImage('assets/face-grim.png', renderBitmap(faceGrim))
	AwaitFile.saveUIRenderImage('assets/face-sad.png', renderBitmap(faceSad))

	AwaitFile.saveUIRenderImage('assets/poop.png', renderBitmap(poopSprite))
	AwaitFile.saveUIRenderImage(
		'assets/heart-filled.png',
		renderBitmap(filledHeart),
	)
	AwaitFile.saveUIRenderImage(
		'assets/heart-hollow.png',
		renderBitmap(hollowHeart),
	)
}
