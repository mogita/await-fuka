import { AnimatedSprite } from '../sprites'

// Adult body archetypes. Each archetype has 4 animation states (idle, eating,
// cleaning, hungry), each 2 frames. Face area (rows 7-13, cols 6-17) is
// transparent so the face overlay can render eyes and mouth on top.
//
// State to usage:
//   idle  : default (also reused during shake; face overlay handles offset)
//   eating: chewing animation; face overlay shows open mouth
//   cleaning: bouncy/excited; face overlay shows open mouth
//   hungry: slumped posture; face overlay shows resting expression

// roly-poly: short, wide, the v1 silhouette. Default familiar shape.
const rolyPolyIdle0: readonly number[][] = [
	[0, 0, 0, 0, 0, 0, 0, 0, 1, 1, 1, 1, 1, 1, 1, 1, 0, 0, 0, 0, 0, 0, 0, 0],
	[0, 0, 0, 0, 0, 0, 1, 1, 0, 0, 0, 0, 0, 0, 0, 0, 1, 1, 0, 0, 0, 0, 0, 0],
	[0, 0, 0, 0, 0, 1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1, 0, 0, 0, 0, 0],
	[0, 0, 0, 0, 1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1, 0, 0, 0, 0],
	[0, 0, 0, 1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1, 0, 0, 0],
	[0, 0, 1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1, 0, 0],
	[0, 0, 1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1, 0, 0],
	[0, 1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1, 0],
	[0, 1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1, 0],
	[0, 1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1, 0],
	[0, 1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1, 0],
	[0, 1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1, 0],
	[0, 1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1, 0],
	[0, 1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1, 0],
	[0, 1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1, 0],
	[1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1],
	[1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1],
	[1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1],
	[1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1],
	[1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1],
	[0, 1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1, 0],
	[0, 1, 1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1, 1, 0],
	[0, 0, 1, 1, 1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1, 1, 0, 0],
	[0, 0, 0, 0, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 0, 0, 0],
]

// rolyPolyIdle1: identical body silhouette (face area blank); breathing motion
// is provided by the fs02 mask alternating between the two frames at runtime.
// For roly-poly we keep both frames identical since the face overlay handles
// expression alternation; future archetypes can introduce subtle body breathing.
const rolyPolyIdle1: readonly number[][] = rolyPolyIdle0

// rolyPolyEating0: body silhouette with chewing motion (cheeks puffed). Same
// silhouette as idle for now; chewing is conveyed by the face overlay's active
// expression cycling between resting and active via fs02. A future iteration
// can add subtle body distortion frames per archetype.
const rolyPolyEating0: readonly number[][] = rolyPolyIdle0
const rolyPolyEating1: readonly number[][] = rolyPolyIdle0

// rolyPolyCleaning0/1: bouncy/excited. Body identical for now; iterate later.
const rolyPolyCleaning0: readonly number[][] = rolyPolyIdle0
const rolyPolyCleaning1: readonly number[][] = rolyPolyIdle0

// rolyPolyHungry0/1: slumped posture. The slump is encoded by reusing idle
// silhouette for now; hunger expression comes from the face overlay's resting
// shape (each personality's resting face still reads the personality even when
// hungry). Iterate to slump-distinct frames in a follow-up.
const rolyPolyHungry0: readonly number[][] = rolyPolyIdle0
const rolyPolyHungry1: readonly number[][] = rolyPolyIdle0

export type BodyAnimSet = {
	idle: AnimatedSprite
	eating: AnimatedSprite
	cleaning: AnimatedSprite
	hungry: AnimatedSprite
}

export const rolyPolyBody: BodyAnimSet = {
	idle: { frames: [rolyPolyIdle0, rolyPolyIdle1], intervalMs: 1000 },
	eating: { frames: [rolyPolyEating0, rolyPolyEating1], intervalMs: 200 },
	cleaning: { frames: [rolyPolyCleaning0, rolyPolyCleaning1], intervalMs: 400 },
	hungry: { frames: [rolyPolyHungry0, rolyPolyHungry1], intervalMs: 800 },
}

// Placeholder exports for the other 3 archetypes. Filled in by Tasks 9-11.
// Kept as undefined initially so adultBodyUrl helpers can stub during dev.
export const lankyBlobBody: BodyAnimSet | undefined = undefined
export const leanSpikeBody: BodyAnimSet | undefined = undefined
export const stoutRockBody: BodyAnimSet | undefined = undefined
