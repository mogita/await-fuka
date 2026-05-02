import { HStack, Rectangle, VStack } from 'await'
import { LED_FG } from './config'
import type { AnimatedSprite } from './sprites'
import {
	cleanIcon,
	eggAnim,
	faceGrim,
	faceSad,
	faceSmile,
	feedIcon,
	filledHeart,
	hollowHeart,
	petEatingAnim,
	petHappyAnim,
	petHungryAnim,
	petIdleAnim,
	petShakeAnim,
	poopSprite,
	statsIcon,
} from './sprites'
import { batBack, featheredBack, insectBack } from './sprites/backs'
import type { BodyAnimSet } from './sprites/bodies'
import {
	lankyBlobBody,
	leanSpikeBody,
	rolyPolyBody,
	stoutRockBody,
} from './sprites/bodies'
import {
	faceCheerfulActive,
	faceCheerfulResting,
	faceGrumpyActive,
	faceGrumpyResting,
	faceInnocentActive,
	faceInnocentResting,
	faceSleepyActive,
	faceSleepyResting,
	faceSlyActive,
	faceSlyResting,
	faceWiseActive,
	faceWiseResting,
} from './sprites/faces'
import { crown, halo, horns, plant } from './sprites/heads'

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
		// v3 evolution sprites
		rolyPolyBody.idle.frames,
		rolyPolyBody.eating.frames,
		rolyPolyBody.cleaning.frames,
		rolyPolyBody.hungry.frames,
		lankyBlobBody.idle.frames,
		lankyBlobBody.eating.frames,
		lankyBlobBody.cleaning.frames,
		lankyBlobBody.hungry.frames,
		leanSpikeBody.idle.frames,
		leanSpikeBody.eating.frames,
		leanSpikeBody.cleaning.frames,
		leanSpikeBody.hungry.frames,
		stoutRockBody.idle.frames,
		stoutRockBody.eating.frames,
		stoutRockBody.cleaning.frames,
		stoutRockBody.hungry.frames,
		faceCheerfulResting,
		faceCheerfulActive,
		faceSleepyResting,
		faceSleepyActive,
		faceSlyResting,
		faceSlyActive,
		faceInnocentResting,
		faceInnocentActive,
		faceGrumpyResting,
		faceGrumpyActive,
		faceWiseResting,
		faceWiseActive,
		halo,
		horns,
		crown,
		plant,
		featheredBack.frames,
		batBack.frames,
		insectBack.frames,
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

	// v3 evolution sprites: adult body archetypes.
	const renderBody = (archetype: string, body: BodyAnimSet) => {
		const states: Array<
			['idle' | 'eating' | 'cleaning' | 'hungry', AnimatedSprite]
		> = [
			['idle', body.idle],
			['eating', body.eating],
			['cleaning', body.cleaning],
			['hungry', body.hungry],
		]
		for (const [stateName, anim] of states) {
			for (let i = 0; i < anim.frames.length; i++) {
				AwaitFile.saveUIRenderImage(
					`assets/body-${archetype}-${stateName}-${i}.png`,
					renderBitmap(anim.frames[i]!),
				)
			}
		}
	}
	renderBody('roly-poly', rolyPolyBody)
	renderBody('lanky-blob', lankyBlobBody)
	renderBody('lean-spike', leanSpikeBody)
	renderBody('stout-rock', stoutRockBody)

	// Face overlays.
	const faces: Array<[string, readonly number[][]]> = [
		['cheerful-resting', faceCheerfulResting],
		['cheerful-active', faceCheerfulActive],
		['sleepy-resting', faceSleepyResting],
		['sleepy-active', faceSleepyActive],
		['sly-resting', faceSlyResting],
		['sly-active', faceSlyActive],
		['innocent-resting', faceInnocentResting],
		['innocent-active', faceInnocentActive],
		['grumpy-resting', faceGrumpyResting],
		['grumpy-active', faceGrumpyActive],
		['wise-resting', faceWiseResting],
		['wise-active', faceWiseActive],
	]
	for (const [name, sprite] of faces) {
		AwaitFile.saveUIRenderImage(`assets/face-${name}.png`, renderBitmap(sprite))
	}

	// Head attachments.
	AwaitFile.saveUIRenderImage('assets/head-halo.png', renderBitmap(halo))
	AwaitFile.saveUIRenderImage('assets/head-horns.png', renderBitmap(horns))
	AwaitFile.saveUIRenderImage('assets/head-crown.png', renderBitmap(crown))
	AwaitFile.saveUIRenderImage('assets/head-plant.png', renderBitmap(plant))

	// Back attachments.
	const backs: Array<[string, AnimatedSprite]> = [
		['feathered', featheredBack],
		['bat', batBack],
		['insect', insectBack],
	]
	for (const [name, anim] of backs) {
		for (let i = 0; i < anim.frames.length; i++) {
			AwaitFile.saveUIRenderImage(
				`assets/back-${name}-${i}.png`,
				renderBitmap(anim.frames[i]!),
			)
		}
	}

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
