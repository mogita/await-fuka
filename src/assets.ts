import { GameState, MenuCursor } from "./state";

// Pure URL resolution. The widget calls these to look up which pre-rendered
// PNG to display for the current state. All pet animations are 2-frame cycles
// driven by the Widget font's fs02 mask (1-second cycle, 0.5s per frame).
// Eating uses frames 0 and 2 from the original 4-frame cycle to keep the
// mouth-open vs mouth-closed contrast.
// Asset names must stay in sync with prerender.tsx (the source of truth for
// what gets saved).

export type PetAnimSpec = {
	urls: readonly [string, string];
};

const PET_EGG_URLS = ["assets/pet-egg-0.png", "assets/pet-egg-1.png"] as const;
const PET_IDLE_URLS = [
	"assets/pet-idle-0.png",
	"assets/pet-idle-1.png",
] as const;
const PET_HUNGRY_URLS = [
	"assets/pet-hungry-0.png",
	"assets/pet-hungry-1.png",
] as const;
const PET_HAPPY_URLS = [
	"assets/pet-happy-0.png",
	"assets/pet-happy-1.png",
] as const;
const PET_EATING_URLS = [
	"assets/pet-eating-0.png",
	"assets/pet-eating-2.png",
] as const;

export function petAnimSpec(state: GameState): PetAnimSpec {
	if (state.stage === "egg") return { urls: PET_EGG_URLS };
	if (state.action?.kind === "feed") return { urls: PET_EATING_URLS };
	if (state.action?.kind === "clean") return { urls: PET_HAPPY_URLS };
	if (state.hunger === 0) return { urls: PET_HUNGRY_URLS };
	return { urls: PET_IDLE_URLS };
}

export function feedIconUrl(cursor: MenuCursor): string {
	return cursor === "feed"
		? "assets/icon-feed-selected.png"
		: "assets/icon-feed-normal.png";
}

export function cleanIconUrl(cursor: MenuCursor): string {
	return cursor === "clean"
		? "assets/icon-clean-selected.png"
		: "assets/icon-clean-normal.png";
}

export const POOP_URL = "assets/poop.png";
export const HEART_FILLED_URL = "assets/heart-filled.png";
export const HEART_HOLLOW_URL = "assets/heart-hollow.png";
