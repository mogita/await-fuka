// @panel {type:'menu',items:[1,100,1000,10000]}
export const worldSpeed = 1

// Debug overrides for the adult sprite. 'default' = use whatever the game
// state holds; any other value forces that variant on the rendered pet
// immediately. When any override is non-'default' the adult sprite renders
// even if the pet hasn't reached adulthood yet, so all variants are testable
// without waiting. The @panel comments are stripped by --minify-whitespace
// in production builds, so these constants stay at 'default' there.

// @panel {type:'menu',items:['default','roly-poly','lanky-blob','lean-spike','stout-rock']}
export const debugBody: string = 'default'

// @panel {type:'menu',items:['default','miserable','down','neutral','content','radiant']}
export const debugFace: string = 'default'

// All intervals in milliseconds at worldSpeed=1.
// Effective interval at runtime: BASE / worldSpeed.
export const HUNGER_INTERVAL_MS = 60 * 60 * 1000 // 60 min per heart drop
export const POOP_INTERVAL_MS = 180 * 60 * 1000 // 3 hours
export const HATCH_DURATION_MS = 30 * 1000 // 30 sec
export const ACTION_FEEDBACK_MS = 2000 // eating/cleaning sprite duration
export const REJECTION_FEEDBACK_MS = 2000 // head-shake duration

// fs02 mask cycle period for sprite frame alternation. The Widget font's
// fs02 feature alternates phases every MASK_CYCLE_MS / 2 milliseconds.
// Multiples of this value in Unix epoch time (60000 % 2000 == 0) align with
// mask phase boundaries, so transient `until` values rounded up to the next
// multiple end the animation at a clean phase boundary instead of mid-frame.
export const MASK_CYCLE_MS = 2000

// Hunger.
export const HUNGER_MAX = 5
export const FRESH_HUNGER = 5

// Weight.
export const FRESH_WEIGHT = 0.1
export const WEIGHT_CAP = 50
export const WEIGHT_FLOOR = 0.01
export const WEIGHT_GROWTH_FRACTION = 0.02
export const ADULT_WEIGHT = 10
export const MAX_WEIGHT_LOSS_PER_HR = 1 / 24 // daily cap of 1kg

// Happiness.
export const FRESH_HAPPINESS = 100
export const HAPPINESS_DECAY_PER_HR = 1
export const HAPPINESS_FEED_BONUS = 10
export const HAPPINESS_CLEAN_BONUS = 15
// 0..sad: sad face. sad+1..grim: grim face. grim+1..100: smile.
export const HAPPY_THRESHOLDS = { sad: 33, grim: 66 }

// Adult face mood tiers, by current (live) happiness. Each value is the upper
// bound of that tier:
//   0..15 miserable, 16..40 down, 41..70 neutral, 71..90 content, 91..100 radiant.
export const MOOD_THRESHOLDS = {
	miserable: 15,
	down: 40,
	neutral: 70,
	content: 90,
}

// Evolution.
export const ADULT_DURATION_MS = 4 * 24 * 60 * 60 * 1000 // 4 days

export const STORE_KEY = 'fuka.state.v1'

// Game Boy LCD palette. Hex strings without '#' match the runtime's RawColor.
// Defined here (not in prerender.tsx or widget.tsx) so the raw-concat build
// produces only one top-level declaration; otherwise both files contribute a
// duplicate const at module scope and esbuild rejects the bundle.
export const LED_BG = '9bbc0f'
export const LED_FG = '0f380f'
