// @panel {type:'slider',min:1,max:100,step:1}
export const worldSpeed = 1;

// All intervals in milliseconds at worldSpeed=1.
// Effective interval at runtime: BASE / worldSpeed.
export const HUNGER_INTERVAL_MS = 60 * 60 * 1000;   // 60 min per heart drop
export const POOP_INTERVAL_MS = 180 * 60 * 1000;    // 3 hours
export const HATCH_DURATION_MS = 30 * 1000;         // 30 sec
export const ACTION_FEEDBACK_MS = 800;              // eating/cleaning sprite duration

export const STORE_KEY = 'fuka.state.v1';

// Game Boy LCD palette. Hex strings without '#' match the runtime's RawColor.
// Defined here (not in prerender.tsx or widget.tsx) so the raw-concat build
// produces only one top-level declaration; otherwise both files contribute a
// duplicate const at module scope and esbuild rejects the bundle.
export const LED_BG = '9bbc0f';
export const LED_FG = '0f380f';
