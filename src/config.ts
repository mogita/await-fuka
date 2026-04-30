// @panel {type:'slider',min:1,max:100,step:1}
export const worldSpeed = 1

// All intervals in milliseconds at worldSpeed=1.
// Effective interval at runtime: BASE / worldSpeed.
export const HUNGER_INTERVAL_MS = 60 * 60 * 1000 // 60 min per heart drop
export const POOP_INTERVAL_MS = 180 * 60 * 1000 // 3 hours
export const HATCH_DURATION_MS = 30 * 1000 // 30 sec
export const ACTION_FEEDBACK_MS = 2000 // eating/cleaning sprite duration
export const REJECTION_FEEDBACK_MS = 2000 // head-shake duration

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
// 0..sad: sad face. sad+1..grim: grim face. grim+1..100: smile.
export const HAPPY_THRESHOLDS = { sad: 33, grim: 66 }

export const STORE_KEY = 'fuka.state.v1'

// Game Boy LCD palette. Hex strings without '#' match the runtime's RawColor.
// Defined here (not in prerender.tsx or widget.tsx) so the raw-concat build
// produces only one top-level declaration; otherwise both files contribute a
// duplicate const at module scope and esbuild rejects the bundle.
export const LED_BG = '9bbc0f'
export const LED_FG = '0f380f'
