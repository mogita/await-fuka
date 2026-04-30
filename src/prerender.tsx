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
const ASSET_HASH_KEY = 'fuka.assets.hash'

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

// FNV-1a 32-bit hash over JSON.stringify of every sprite import. Used to
// detect bitmap changes between bundle versions so the prerender knows when
// to regenerate the on-disk PNG cache. Cheap to compute (small integer
// arrays, runs once per Await app launch) and orders-of-magnitude smaller
// than the existing renderBitmap pass.
function hashSprites(): number {
	const data = JSON.stringify([
		eggAnim.frames,
		petIdleAnim.frames,
		petHungryAnim.frames,
		petEatingAnim.frames,
		petHappyAnim.frames,
		petShakeAnim.frames,
		poopSprite,
		feedIcon,
		cleanIcon,
		statsIcon,
		filledHeart,
		hollowHeart,
		faceSmile,
		faceGrim,
		faceSad,
	])
	let h = 0x811c9dc5
	for (let i = 0; i < data.length; i++) {
		h ^= data.charCodeAt(i)
		h = Math.imul(h, 0x01000193) >>> 0
	}
	return h
}

export function preRender(): void {
	if (AwaitEnv.host === 'widget') return

	const currentHash = hashSprites()
	const storedHash = AwaitStore.get(ASSET_HASH_KEY)
	if (storedHash === currentHash) return

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

	AwaitStore.set(ASSET_HASH_KEY, currentHash as Encodable)
}
