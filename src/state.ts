import { STORE_KEY } from "./config";

export type GameStage = "egg" | "pet";
export type ActionKind = "feed" | "clean";
export type MenuCursor = "none" | "feed" | "clean";

export type GameState = {
	installedAt: number;
	stage: GameStage;
	hunger: number;
	hasPoop: boolean;
	lastHungerCheckAt: number;
	lastPoopCheckAt: number;
	menuCursor: MenuCursor;
	action: { kind: ActionKind; until: number } | undefined;
};

export function freshState(now: number): GameState {
	return {
		installedAt: now,
		stage: "egg",
		hunger: 4,
		hasPoop: false,
		lastHungerCheckAt: now,
		lastPoopCheckAt: now,
		menuCursor: "none",
		action: undefined,
	};
}

export function isValidState(value: unknown): value is GameState {
	if (typeof value !== "object" || value === null) return false;
	const v = value as Record<string, unknown>;
	if (typeof v.installedAt !== "number") return false;
	if (v.stage !== "egg" && v.stage !== "pet") return false;
	if (typeof v.hunger !== "number") return false;
	if (v.hunger < 0 || v.hunger > 4) return false;
	if (typeof v.hasPoop !== "boolean") return false;
	if (typeof v.lastHungerCheckAt !== "number") return false;
	if (typeof v.lastPoopCheckAt !== "number") return false;
	if (
		v.menuCursor !== "none" &&
		v.menuCursor !== "feed" &&
		v.menuCursor !== "clean"
	)
		return false;
	if (v.action !== undefined) {
		if (typeof v.action !== "object" || v.action === null) return false;
		const a = v.action as Record<string, unknown>;
		if (a.kind !== "feed" && a.kind !== "clean") return false;
		if (typeof a.until !== "number") return false;
	}
	return true;
}

export function loadOrInit(now: number): GameState {
	const raw = AwaitStore.get(STORE_KEY);
	if (isValidState(raw)) return raw;
	const fresh = freshState(now);
	AwaitStore.set(STORE_KEY, fresh as Encodable);
	return fresh;
}

export function save(state: GameState): void {
	AwaitStore.set(STORE_KEY, state as Encodable);
}
